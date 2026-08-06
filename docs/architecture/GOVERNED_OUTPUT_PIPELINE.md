# Governed Output Pipeline — Specification

**Version**: 1.0
**Created**: 2026-08-05
**Status**: Ready for review — Phase 1 detailed, Phases 2–7 outlined

## 1. Positioning (why this exists)

Flowspace runs AI agents and proves what they did. Every artifact an agent
produces, every risky action, every approval, every credential use flows
through one spine:

```
create → version → approve-if-risky → audit → deliver
```

Org-scoped. Signed. Tamper-evident. Exportable.

Commercial basis (research, Aug 2026): OpenAI retains compliance logs 30 days
best-effort; Anthropic exports only the last 180 days; ServiceNow governs
*other* vendors' agents. No incumbent ships an in-product immutable,
verifiably-exportable archive. EU AI Act Art. 12/14/19 (deferred to Dec 2027
by the Digital Omnibus but contracted today), FINRA 3110/4511 + 17a-4
(WORM-or-audit-trail, 3–6 year retention), and GDPR Art. 30 (attributable
operation-level records) all demand exactly this. The desktop OS remains the
product vision; this pipeline is the spine it renders on top of.

## 2. Target architecture

```
AGENT / USER / API KEY
        │  action
        ▼
writeAuditLog() ──▶ chain mechanics (server-side, org-boundary)
        │             1. load org signing key (Ed25519, wrapped w/ org DEK)
        │             2. fetch chain head (last orgSeq/prevHash/prevTimestamp)
        │             3. canonical-serialize record
        │             4. hash = SHA-256(canonical ‖ prevHash)
        │             5. signature = Ed25519(hash) — key never in agent boundary
        ▼
AuditLog table (append-only)  ◀── unique(organizationId, orgSeq)
        │
        ├──▶ GET /api/v1/audit-logs              (existing, + retention class)
        ├──▶ GET /api/v1/audit-logs/verify       (chain health: gaps, sigs, root)
        └──▶ GET /api/v1/audit-logs/export       (signed bundle for auditors)
```

Phases build on this spine: tool-call telemetry (2), artifact provenance (3),
approval hardening (4), coverage/consistency (5), retention lifecycle + deliver
model (6), engine sessions (7).

## 3. Phase 1 — Tamper-evident audit spine (detailed spec)

### 3.1 Design decisions (locked)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Evolve `AuditLog` in place** — add chain fields, do not create a parallel ledger | Existing read paths (`/api/v1/audit-logs`, `search-audit-logs` tool) keep working; one table of record. |
| D2 | **Per-org hash chain** — sequence, previous hash, previous timestamp scoped per `organizationId`; `@@unique([organizationId, orgSeq])` | Org is the security boundary (org DEK, org keys). Per-org chains allow per-org export/verification and future customer-owned keys. |
| D3 | **Canonical serialization** — deterministic field-ordered encoding of record content (stable key order, no whitespace variance); `hash = SHA-256(canonical ‖ prevHash)` | Offline verifiers must reproduce the exact bytes. Any serializer drift breaks verification. |
| D4 | **Sign the hash, not the record** — `signature = Ed25519(hash)` | Binds signature → hash → content+prevHash with a single signature operation; verifier recomputes hash from canonical form. |
| D5 | **Per-org Ed25519 signing key, private key wrapped with the org DEK** (`AuditSigningKey` row, same envelope pattern as secrets) | Key never leaves server-side code; agents never hold it (zero-leak pattern holds). DEK wrapping allows future key rotation and customer-owned KMS without schema churn. |
| D6 | **Chain head** — first record for an org: `orgSeq = 1`, `prevHash = null`, `prevTimestamp = null` | Anchor of the chain; root record signed with org key. |
| D7 | **Concurrency** — unique `(organizationId, orgSeq)` + retry-on-conflict loop inside a transaction | Guarantees no duplicate sequence numbers (gap detection stays meaningful) without a lock table. |
| D8 | **Retention classes** — `RetentionClass` enum on every record (`ops` / `audit` / `regulated` / `docs`); default `audit` | Tiered retention (GDPR-defensible, cost-sane). Purge jobs are Phase 6 and must honor the 6-month floor and re-anchor the chain. |
| D9 | **Root records** — daily Merkle root written as an `audit_root` action record with `anchorHash`/`anchorProof` nullable fields | Enables external anchoring (RFC 3161 TSA / HSM in a separate trust domain) in Phase 1b without schema churn. Phase 1 signs roots with the org key. |
| D10 | **Log-access logging** — reading audit records itself creates an `audit_log_read` entry | GDPR Art. 30 evidence + C6 from compliance research. |
| D11 | **`writeAuditLog` signature unchanged** | All existing callers (projects, secrets, documents, tasks, integrations, proposals, agent-proxy) keep working; mechanics change internally. New provenance fields arrive in Phases 2–3. |

### 3.2 Schema changes (`prisma/schema.prisma`)

```prisma
enum RetentionClass {
  ops
  audit
  regulated
  docs
}

model AuditSigningKey {
  id                String   @id @default(cuid())
  organizationId    String   @unique @map("organization_id")
  publicKey         String   @map("public_key")           // base64 raw Ed25519 PK
  wrappedPrivateKey String   @map("wrapped_private_key")  // AES-256-GCM w/ org DEK
  wrapIv            String   @map("wrap_iv")
  wrapAuthTag       String   @map("wrap_auth_tag")
  algorithm         String   @default("ed25519") @map("algorithm")
  keyVersion        Int      @default(1) @map("key_version")
  createdAt         DateTime @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("audit_signing_key")
}

// AuditLog — new fields
model AuditLog {
  id             String         @id @default(cuid())
  organizationId String         @map("organization_id")
  orgSeq         Int            @map("org_seq")            // per-org chain position
  actorUserId    String?        @map("actor_user_id")
  actorType      String         @default("user") @map("actor_type")
  action         AuditAction
  resourceType   String         @map("resource_type")
  resourceId     String?        @map("resource_id")
  metadata       Json?
  ipAddress      String?        @map("ip_address")
  userAgent      String?        @map("user_agent")
  retentionClass RetentionClass @default(audit) @map("retention_class")
  prevHash       String?        @map("prev_hash")          // SHA-256 hex; null for head
  prevTimestamp  DateTime?      @map("prev_timestamp")     // backdating guard
  hash           String         @map("hash")               // SHA-256(canonical ‖ prevHash)
  signature      String         @map("signature")          // Ed25519(hash), base64
  signingKeyId   String         @map("signing_key_id")
  createdAt      DateTime       @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  actor        User?        @relation(fields: [actorUserId], references: [id], onDelete: SetNull)

  @@unique([organizationId, orgSeq])
  @@index([organizationId, createdAt])
  @@index([resourceType, resourceId])
  @@map("audit_log")
}
```

New `AuditAction` values: `audit_root`, `audit_export`, `audit_log_read`,
`audit_key_rotate` (file/repo/webhook/sandbox/tool_call actions arrive in
Phase 5 with the coverage pass).

### 3.3 Crypto helpers (`lib/crypto.ts` additions)

```typescript
generateEd25519KeyPair(): { publicKey: string; privateKey: string } // base64 raw
signHash(hashHex: string, privateKey: string): string               // base64 sig
verifyHash(hashHex: string, signature: string, publicKey: string): boolean
```

`node:crypto` `generateKeyPairSync("ed25519")` / `sign` / `verify`.

### 3.4 Key service (`lib/services/audit-signing-keys.ts`)

- `ensureAuditSigningKey(organizationId): AuditSigningKey` — create if absent
  (generate pair, wrap private key with org DEK via `encryptString`), cache
  like `getOrganizationDek`.
- `getAuditSigningKey(organizationId): AuditSigningKey`.
- `signAuditHash(organizationId, hashHex): { signature, keyId }` — unwrap DEK,
  unwrap private key, sign, log `audit_key_rotate` on rotation (rotation is
  Phase 1b).
- Public key is safe to expose; verification endpoints return it.

### 3.5 Chain mechanics (`lib/services/audit.ts` rewrite)

`writeAuditLog(input)` (signature unchanged, see D11) becomes:

1. `tx` begin. Load last record: `findFirst({ where: { organizationId }, orderBy: { orgSeq: "desc" } })`.
2. Build canonical payload: deterministic key-ordered JSON of
   `{ organizationId, orgSeq: nextSeq, actorUserId, actorType, action, resourceType, resourceId, metadata, ipAddress, userAgent, retentionClass, prevHash, prevTimestamp: prev?.createdAt ?? null, createdAt }` — **stable key order, fixed field list** (see 3.8).
3. `hash = sha256Hex(canonicalBytes + (prevHash ?? ""))`.
4. `{ signature, keyId } = signAuditHash(organizationId, hash)`.
5. `insert` with `orgSeq: nextSeq`.
6. On unique-violation (`organizationId, orgSeq`): rollback, refetch head, retry (max 3).
7. Commit.

`verifyAuditChain(organizationId)`:
- Walk all records ordered by `orgSeq`; assert continuity (seq increments by 1),
  recompute each `hash` from stored canonical fields, assert `prevHash` matches
  previous record's `hash`, verify `signature` with the org public key.
- Return `{ valid, firstSeq, lastSeq, count, gaps: number[], failures: string[] }`.

`exportAuditBundle(organizationId, opts?)`:
- Records (optionally filtered by retention class / date range), public key,
  chain metadata, verification instructions — returned as structured JSON for
  the route to package (zip in Phase 1b; JSON now). Export itself is logged
  (`audit_export`).

### 3.6 API routes

- `GET /api/v1/audit-logs` — **existing route unchanged** except: reads now log
  an `audit_log_read` entry; optional `?retentionClass=` filter; optional
  `?verify=true` returns `verifyAuditChain` summary alongside.
- `GET /api/v1/audit-logs/verify` — chain health (D-gated `audit:read`):
  `{ lastSeq, gapCount, valid, lastRoot }`.
- `GET /api/v1/audit-logs/export` — `audit:read`; returns
  `{ bundle, publicKey, chain: { firstSeq, lastSeq, count }, exportedAt }`;
  logs `audit_export`.

### 3.7 Canonical serialization contract (critical)

- Fixed field list, fixed order (as listed in 3.5 step 2).
- `null` written as JSON `null`; strings UTF-8; `metadata` is
  `JSON.stringify` with **sorted keys, no spaces**; numbers/booleans raw.
- `createdAt` and `prevTimestamp` serialized as ISO 8601 UTC millisecond
  strings (e.g. `2026-08-05T12:00:00.000Z`).
- This contract is exported from `lib/services/audit.ts` and reused by both
  the writer and the verifier — single source of truth, no drift.

### 3.8 Open questions for review

1. Canonicalization: sorted-key JSON vs hand-rolled field concat — which is
   safer against drift and injection into metadata?
2. `metadata` is arbitrary JSON from callers — should the canonical hash
   exclude it (hash of core fields only) to avoid re-verification complexity,
   or include it (stronger provenance)?
3. Concurrency: unique+retry vs advisory lock per org — is retry acceptable at
   expected audit write rates (bursts from agent loops)?
4. Retention class default `audit` vs deriving from `action` — derive
   `regulated` for proposal/proxy actions automatically?
5. Root records (D9): daily Merkle root generation in Phase 1 or defer to 1b
   with external anchoring together?

## 4. Phase 2 — Agent action logging (outline)

- Tool-call telemetry in `lib/ai/agent.ts` (ToolLoopAgent loop hooks): every
  tool invocation → audit entry with agent ID, model version, session ID,
  tool, input/output hashes, outcome, refusals/blocked.
- New `AuditAction` values `tool_call`, `tool_call_blocked`, `sandbox_create`,
  `sandbox_delete`, `agent_proxy_call` already exists.
- Wire `agentProxyTool` to log (currently bypasses audit entirely).

## 5. Phase 3 — Artifact provenance (outline)

- `ProjectFile` gains `agentSessionId`, `toolName`, `promptHash`, `contentHash`.
- `createArtifactTool` context carries `agentSessionId`; attributes output to
  the producing agent session, not the requesting human.
- Content hashes on stored artifacts (SHA-256 at upload).

## 6. Phase 4 — Approval hardening (outline)

- Multi-party: `requiredApprovers`, `approvalThreshold` (2-of-3) on
  `ActionProposal`; SoD check (proposer ≠ approver); TTL/expiry; override
  event type + kill-switch API per org.
- Signed approval artifacts: approval record signed with org audit key
  (evidence of identity + intent + integrity, AES-level per eIDAS reading).
- Fix `/api/agents/proposals/*/approve|reject` permission bypass (viewer can
  approve today).
- `riskLevel`-gated auto-approve path (audited) for low-risk actions.

## 7. Phase 5 — Coverage & consistency (outline)

- Migrate bypass call sites to `writeAuditLog` (file routes log
  `project_update` today — reclassify to `file_*`; webhook routes).
- New `AuditAction` values: `file_*`, `repository_*`, `webhook_*`,
  `sandbox_*`, `member_*`, `tool_call`.
- Org-scope the generic sandbox list endpoint; remove/kill unauthenticated
  `admin/seed`.

## 8. Phase 6 — Delivery & retention (outline)

- `Deploy`/`Release` entity (deploy/publish results today live only in
  `proposal.payload.executionResult`).
- Retention lifecycle jobs: tiered purge honoring chain verification +
  6-month floor; re-anchor after purge; signed bundle export (zip) + C2PA
  manifests on artifact export (Art. 50 marking).

## 9. Phase 7 — Engine sessions (outline)

- `AppEngineSession` model + `engine` AgentType (per
  `IMPLEMENTATION_PLAN_APP_ENGINES.md`), now with per-session audit linkage
  from Phases 1–3. Desktop OS apps render on the governed spine.

## 10. Success criteria (Phase 1)

- [ ] Every `writeAuditLog` call produces a hash-chained, Ed25519-signed row; existing callers unchanged.
- [ ] `verifyAuditChain` passes on live data; mutating any stored record fails verification.
- [ ] Unique `(organizationId, orgSeq)` enforced; concurrent writes do not duplicate sequence numbers.
- [ ] `GET /api/v1/audit-logs/verify` and `/export` work, org-scoped, `audit:read` gated.
- [ ] Reading audit logs is itself audited (`audit_log_read`).
- [ ] Migration + `pnpm db:generate` clean; prettier clean; no typecheck until plan complete (repo rule).

## 11. Risks & mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Canonicalization drift breaks verification | High | Single exported contract + verifier reuses writer's serializer |
| Chain write latency under agent bursts | Med | Unique+retry; batch roots later; index on `(organizationId, orgSeq)` |
| Signing key compromise | High | Key wrapped w/ org DEK, never in agent boundary, rotation path in 1b |
| Migration on large audit table | Med | Additive columns; backfill chain in background job (Phase 1b) |

---

## 12. Oracle Review Reconciliation (v1.1, 2026-08-05)

Independent review verdict: **changes required** — crypto core sound; boundary conditions fixed below. Supersedes earlier sections where they conflict.

### Adopted changes

| # | Decision | Supersedes |
|---|---|---|
| R1 | Add `canonical TEXT` column storing the exact UTF-8 bytes hashed. `hash` (renamed **`recordHash`**) = `sha256(canonical ‖ prevHash)`. Verifier recomputes from stored `canonical`, verifies signature, and does semantic `deep-equal(JSON.parse(fields), JSON.parse(canonical))` for field-mutation detection. | P0-1; §11 risk row 1 eliminated by construction |
| R2 | **10 direct `db.auditLog.create` bypass sites migrate to `writeAuditLog` in Phase 1**: `files/upload`, `files/confirm`, `files/[fileId]`, `files/[fileId]/download`, `files/[fileId]/restore/[versionId]`, `repositories/[repositoryId]/webhooks`, `.../webhooks/[webhookId]`. Chain integrity is all-or-nothing. (Action reclassification to `file_*` stays Phase 5.) | P0-2; §10 success criteria |
| R3 | FKs `Restrict`: `AuditLog.actor` and `AuditLog.organization` — no `SetNull`/`Cascade`. User deletion is soft-delete/deactivate; org deletion requires export-then-delete. | P0-3 |
| R4 | Migration sequence: add chain columns **nullable** (unique permits multiple NULLs) → backfill per org ordered by `(createdAt, id)` → `SET NOT NULL`. Writer fetches tail with the **same tiebreak**. Canonical contract frozen before first chained write (deploy gate). | P0-4; §3.2 |
| R5 | DB-level append-only: `REVOKE UPDATE, DELETE ON audit_log` from app role + `BEFORE UPDATE OR DELETE` trigger raising exception. Requires R3 first. Backfill runs with migration role / temporary grant. | P0-5 |
| R6 | Per-version signing keys: `@@unique([organizationId, keyVersion])`, `active Boolean`, `retiredAt DateTime?`. Verification resolves key by `signingKeyId`; export carries key registry. | P1-1 |
| R7 | Signature contract pinned: Ed25519 over the **raw 32-byte digest** (hex-decoded), keys PKCS8 DER base64. Stated in §3.7 + exported with bundle. | P1-2 |
| R8 | Writer passes `createdAt: new Date()` explicitly so hashed == stored (no `@default(now())` reliance). | P1-3 |
| R9 | No silent audit failures: `agent-proxy/route.ts:113-125` empty `.catch` fixed; regulated-class write failures surface. | P1-4 |
| R10 | `prevTimestamp` dropped (redundant with `prevHash`). | P2 |
| R11 | `verify` reports `gaps` as structural warnings; only hash/signature failures are `invalid`. Phase 6 purge creates intentional gaps + re-anchors. | P2 |
| R12 | `canonicalVersion Int @default(1)` added. `audit_log_read` must not recurse; internal tool reads rate-limited later. | P2 |
| R13 | Merkle roots + external anchoring deferred to Phase 1b (no root records in Phase 1; anchor proofs live in `metadata` when they arrive). | Q5, D9 |
| R14 | Retention class **derived from action** via central exhaustive `retentionClassFor(action)` mapping (`proposal_*`, `agent_proxy_call`, `secret_reveal/export/import/version_create`, `audit_export`, `audit_key_rotate` → `regulated`; rest → `audit`); derived value stored denormalized on the row. | Q4 |
| R15 | `@@unique([organizationId, orgSeq])` + retry-on-conflict, retry loop **wraps the entire `$transaction`** (P2002 aborts the tx in Prisma interactive mode), max 3 attempts, fail loudly. No advisory locks. | Q3 |
| R16 | `metadata` included in the canonical hash (audit spine's evidence lives there). Safe under R1's stored-canonical design. | Q2 |
| R17 | Serializer: **sorted-key JSON** (self-delimiting, injection-safe); number canonicalization handled by R1's stored-bytes design. | Q1 |

### Remaining open (post-review)

1. Backfill script location: one-off script under `scripts/` vs inline migration SQL — implementation choice, no design impact.
2. `search-audit-logs` tool's stale action subset — pre-existing, Phase 5.
3. `ops`/`docs` retention classes: in the enum, no writers until Phases 2–3.

### Deployment runbook (Phase 1)

Order matters — the append-only trigger must not exist before backfill:

1. **Migrate** — apply `prisma/migrations/20260805090000_add_audit_chain` (additive: nullable chain columns, `RetentionClass` enum, 3 new `AuditAction` values, `audit_signing_key` table, both `audit_log` FKs → `ON DELETE RESTRICT`). The Prisma schema keeps the chain columns nullable so there is no migration drift.
2. **Backfill** — run `scripts/backfill-audit-chain.ts` (needs `DIRECT_DATABASE_URL`/`DATABASE_URL` + `MASTER_KEY`). Chains existing rows per org ordered by `(createdAt, id)`, writes `canonical`/`recordHash`/`signature`, and opens a maintenance path via `set_config('app.audit_append_only','off',true)` inside each per-org transaction. Idempotent; safe to re-run.
3. **Enforce** — apply `scripts/enforce-audit-append-only.sql` (idempotent): `BEFORE UPDATE OR DELETE` trigger raising an exception + `REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM PUBLIC`. **Role split:** the app must run as a dedicated NON-OWNER role with only `INSERT`/`SELECT` on `audit_log` (privileges then enforce append-only even if the `app.audit_append_only` GUC is set); the owner role (`neondb_owner`) is for migrations/backfill only. Optional R4 `SET NOT NULL` hardening is commented out in that file (excludes `prev_hash` — the root row of each chain is NULL); applying it requires a schema edit + follow-up migration.
4. **Verify (cutover gate)** — before routing app traffic, call `GET /api/v1/audit-logs/verify` for **every** org: it must report `unchained === 0` (and `valid === true`). Any org with `unchained > 0` means the backfill is incomplete — do not cut over.
5. **Deploy gate** — the canonical serializer (`CANONICAL_VERSION = 1`, `lib/services/audit.ts`) is frozen before the first chained write; future serializer changes go through `canonicalVersion` bumps, never in-place.

The configured `DATABASE_URL`/`DIRECT_DATABASE_URL` (Neon, role `neondb_owner`) was unreachable from the build environment when this was written (P1001) — steps 1–3 must run against a reachable database.
