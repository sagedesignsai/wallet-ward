import { createHash } from "node:crypto"
import type { AuditAction, Prisma, RetentionClass } from "@prisma/client"
import { prisma } from "@/lib/db"
import type { AuthContext } from "@/lib/api/auth"
import { verifyAuditDigest } from "@/lib/crypto"
import {
  listSigningKeys,
  signAuditHash,
} from "@/lib/services/audit-signing-keys"
import { retentionClassFor } from "@/lib/services/retention-classes"

// ─── Canonical serialization contract (exported for the bundle) ──────────────

export const CANONICAL_VERSION = 1
export const SIGNING_ALGORITHM = "ed25519-pkcs8-der"
export const SERIALIZER_DESCRIPTION =
  "sorted-key JSON (recursive); timestamps as ISO-8601 UTC millisecond strings; hash = sha256(canonical || prevHash) over UTF-8 bytes; object keys are sorted in UTF-16 code-unit order (JS Array.prototype.sort)"

// sha256Hex helper (string input) — shared by writer, verifier and backfill.
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex")
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys)
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortKeys(obj[key])
    }
    return out
  }
  return value
}

export function canonicalizeAuditRecord(
  fields: Record<string, unknown>
): string {
  return JSON.stringify(sortKeys(fields))
}

// The exact semantic fields hashed into `canonical`. The writer builds these,
// the verifier extracts them back from the stored row; the two must never
// drift. createdAt is serialized to its ISO-8601 UTC millisecond string so a
// Date object deep-equals the value JSON.parse produces.
type AuditRecordContent = {
  organizationId: string
  orgSeq: number | null
  actorUserId: string | null
  actorType: string
  action: AuditAction
  resourceType: string
  resourceId: string | null
  metadata: Prisma.JsonValue
  ipAddress: string | null
  userAgent: string | null
  retentionClass: RetentionClass
  createdAt: Date
}

function auditRecordContent(
  input: AuditRecordContent
): Record<string, unknown> {
  return {
    organizationId: input.organizationId,
    orgSeq: input.orgSeq,
    actorUserId: input.actorUserId,
    actorType: input.actorType,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    // null metadata never reaches the canonical contract (writer always emits
    // an object); the guard covers pre-migration rows for the verifier only.
    metadata: input.metadata ?? {},
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    retentionClass: input.retentionClass,
    createdAt: input.createdAt.toISOString(),
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((value, index) => deepEqual(value, b[index]))
  }
  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj).sort()
    const bKeys = Object.keys(bObj).sort()
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }
  return false
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  )
}

// ─── Writer ──────────────────────────────────────────────────────────────────

const MAX_CHAIN_RETRIES = 3

export async function writeAuditLog(input: {
  ctx: Pick<
    AuthContext,
    "userId" | "actorType" | "ipAddress" | "userAgent" | "apiKeyId"
  >
  organizationId: string
  action: AuditAction
  resourceType: string
  resourceId?: string | null
  metadata?: Prisma.InputJsonValue
}) {
  const { ctx, organizationId, action, resourceType, resourceId, metadata } =
    input

  // The entire interactive transaction is retried on unique violation
  // (P2002 aborts the tx in Prisma interactive mode). Never silently swallow.
  for (let attempt = 1; attempt <= MAX_CHAIN_RETRIES; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const tail = await tx.auditLog.findFirst({
          where: { organizationId },
          orderBy: { orgSeq: "desc" },
          select: { orgSeq: true, recordHash: true },
        })

        const orgSeq = (tail?.orgSeq ?? 0) + 1
        const prevHash = tail?.recordHash ?? null
        // Client-set createdAt so hashed == stored (no @default(now()) reliance)
        const createdAt = new Date()
        const retentionClass = retentionClassFor(action)

        const fields: AuditRecordContent = {
          organizationId,
          orgSeq,
          actorUserId: ctx.actorType === "user" ? ctx.userId : null,
          actorType: ctx.actorType,
          action,
          resourceType,
          resourceId: resourceId ?? null,
          metadata: {
            ...(metadata && typeof metadata === "object" ? metadata : {}),
            ...(ctx.apiKeyId ? { apiKeyId: ctx.apiKeyId } : {}),
          } as Prisma.JsonValue,
          ipAddress: ctx.ipAddress ?? null,
          userAgent: ctx.userAgent ?? null,
          retentionClass,
          createdAt,
        }

        const canonical = canonicalizeAuditRecord(auditRecordContent(fields))
        const recordHash = sha256Hex(canonical + (prevHash ?? ""))
        const { signature, signingKeyId } = await signAuditHash(
          organizationId,
          Buffer.from(recordHash, "hex")
        )

        await tx.auditLog.create({
          data: {
            ...fields,
            metadata: fields.metadata as Prisma.InputJsonValue,
            canonical,
            canonicalVersion: CANONICAL_VERSION,
            recordHash,
            signature,
            signingKeyId,
            prevHash,
          },
        })
      })
      return
    } catch (error) {
      if (attempt < MAX_CHAIN_RETRIES && isUniqueViolation(error)) {
        continue
      }
      throw error
    }
  }
}

// ─── Verification ────────────────────────────────────────────────────────────

export type AuditChainVerification = {
  valid: boolean
  gaps: number[]
  invalid: Array<{ orgSeq: number; reason: string }>
  checked: number
  unchained: number
}

export async function verifyAuditChain(
  organizationId: string
): Promise<AuditChainVerification> {
  const rows = await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: { orgSeq: "asc" },
  })

  const invalid: Array<{ orgSeq: number; reason: string }> = []
  const gaps: number[] = []
  let checked = 0
  let unchained = 0
  let prevSeq = 0

  // Resolve every signing key in one query (no per-row N+1).
  const signingKeyIds = Array.from(
    new Set(
      rows
        .filter((row) => row.orgSeq != null && row.recordHash)
        .map((row) => row.signingKeyId)
        .filter((id): id is string => Boolean(id))
    )
  )
  const signingKeys = new Map(
    (
      await prisma.auditSigningKey.findMany({
        where: { id: { in: signingKeyIds } },
      })
    ).map((key) => [key.id, key])
  )

  for (const row of rows) {
    // Unchained rows (orgSeq null) exist only during the migration window.
    if (row.orgSeq == null || !row.recordHash) {
      unchained++
      continue
    }

    checked++

    // Structural warning only (R11): missing sequence numbers never count as
    // invalid — Phase 6 purge will create intentional gaps and re-anchor.
    if (row.orgSeq > prevSeq + 1) {
      for (let seq = prevSeq + 1; seq < row.orgSeq; seq++) {
        gaps.push(seq)
      }
    }
    prevSeq = row.orgSeq

    if (!row.canonical) {
      invalid.push({ orgSeq: row.orgSeq, reason: "missing canonical" })
      continue
    }

    // 1. Hash: recompute recordHash from the STORED canonical + prevHash.
    const recomputed = sha256Hex(row.canonical + (row.prevHash ?? ""))
    if (recomputed !== row.recordHash) {
      invalid.push({ orgSeq: row.orgSeq, reason: "recordHash mismatch" })
    }

    // 2. Signature: Ed25519 over the raw 32-byte digest, key by signingKeyId.
    //    A chained row must carry the full signature pair: one field present
    //    without the other, or both missing, is invalid (only unchained rows
    //    skip).
    if (!row.signature || !row.signingKeyId) {
      invalid.push({
        orgSeq: row.orgSeq,
        reason:
          row.signature || row.signingKeyId
            ? "incomplete signature fields"
            : "missing signature fields",
      })
    } else {
      const key = signingKeys.get(row.signingKeyId)
      if (!key) {
        invalid.push({
          orgSeq: row.orgSeq,
          reason: `unknown signingKeyId: ${row.signingKeyId}`,
        })
      } else if (
        !verifyAuditDigest(
          key.publicKey,
          Buffer.from(row.recordHash, "hex"),
          row.signature
        )
      ) {
        invalid.push({ orgSeq: row.orgSeq, reason: "signature mismatch" })
      }
    }

    // 3. Content: semantic deep-equal of stored fields (minus chain cols)
    //    versus JSON.parse(canonical).
    try {
      const canonicalContent = JSON.parse(row.canonical) as unknown
      if (!deepEqual(auditRecordContent(row), canonicalContent)) {
        invalid.push({ orgSeq: row.orgSeq, reason: "content mismatch" })
      }
    } catch {
      invalid.push({ orgSeq: row.orgSeq, reason: "canonical not JSON" })
    }
  }

  return {
    valid: invalid.length === 0,
    gaps,
    invalid,
    checked,
    unchained,
  }
}

// ─── Export bundle ───────────────────────────────────────────────────────────

export type AuditSigningKeyBundleEntry = {
  id: string
  keyVersion: number
  publicKey: string
  active: boolean
  retiredAt: string | null
}

export type AuditBundle = {
  contract: {
    canonicalVersion: number
    signingAlgorithm: string
    serializerDescription: string
  }
  signingKeys: AuditSigningKeyBundleEntry[]
  records: Record<string, unknown>[]
}

export async function exportAuditBundle(
  organizationId: string
): Promise<AuditBundle> {
  const [records, signingKeys] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { orgSeq: "asc" },
    }),
    listSigningKeys(organizationId),
  ])

  return {
    contract: {
      canonicalVersion: CANONICAL_VERSION,
      signingAlgorithm: SIGNING_ALGORITHM,
      serializerDescription: SERIALIZER_DESCRIPTION,
    },
    signingKeys: signingKeys.map((key) => ({
      ...key,
      retiredAt: key.retiredAt?.toISOString() ?? null,
    })),
    records: records.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}
