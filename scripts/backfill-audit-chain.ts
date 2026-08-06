#!/usr/bin/env node

/**
 * One-off backfill: assign orgSeq + chain fields to pre-existing AuditLog rows.
 *
 * Per org (ordered by (createdAt, id), idempotent — orgs that already have
 * chained rows are skipped):
 *   1. open a transaction
 *   2. first statement: SELECT set_config('app.audit_append_only', 'off', true)
 *      — the DB append-only trigger (added in the same migration sequence)
 *      honors this per-transaction config, allowing the UPDATEs below
 *   3. assign orgSeq 1..n, canonicalize via the same canonicalizeAuditRecord,
 *      compute recordHash/signature via the same services, UPDATE the rows
 *
 * Run with: npx tsx scripts/backfill-audit-chain.ts
 * Requires DATABASE_URL / MASTER_KEY (org DEKs wrap the signing keys).
 */

import { prisma } from "@/lib/db"
import {
  CANONICAL_VERSION,
  canonicalizeAuditRecord,
  sha256Hex,
} from "@/lib/services/audit"
import {
  ensureAuditSigningKey,
  signAuditHash,
} from "@/lib/services/audit-signing-keys"
import { retentionClassFor } from "@/lib/services/retention-classes"

async function backfillOrganization(organizationId: string): Promise<number> {
  // Idempotent: skip orgs that already have any chained rows.
  const alreadyChained = await prisma.auditLog.findFirst({
    where: { organizationId, orgSeq: { not: null } },
    select: { id: true },
  })
  if (alreadyChained) {
    return 0
  }

  const rows = await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  })

  if (rows.length === 0) {
    return 0
  }

  // Ensure a signing key exists before the transaction; the key row lives in
  // audit_signing_key (no append-only trigger) so it can be created here.
  await ensureAuditSigningKey(organizationId)

  let updated = 0
  await prisma.$transaction(async (tx) => {
    // Append-only trigger cooperation: is_local=true scopes this to the
    // current transaction, so the UPDATEs below are allowed.
    await tx.$queryRaw`SELECT set_config('app.audit_append_only', 'off', true)`

    let prevHash: string | null = null

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const orgSeq = i + 1
      const retentionClass = retentionClassFor(row.action)

      const fields = {
        organizationId: row.organizationId,
        orgSeq,
        actorUserId: row.actorUserId,
        actorType: row.actorType,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        metadata: row.metadata ?? {},
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        retentionClass,
        createdAt: row.createdAt,
      }

      const canonical = canonicalizeAuditRecord(fields)
      const recordHash = sha256Hex(canonical + (prevHash ?? ""))
      const { signature, signingKeyId } = await signAuditHash(
        organizationId,
        Buffer.from(recordHash, "hex")
      )

      await tx.auditLog.update({
        where: { id: row.id },
        data: {
          orgSeq,
          canonical,
          canonicalVersion: CANONICAL_VERSION,
          recordHash,
          signature,
          signingKeyId,
          prevHash,
          retentionClass,
        },
      })

      prevHash = recordHash
      updated++
    }
  })

  return updated
}

async function main() {
  const orgs = await prisma.organization.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  })

  let total = 0
  for (const org of orgs) {
    const count = await backfillOrganization(org.id)
    if (count > 0) {
      console.log(`[backfill] org ${org.id}: chained ${count} rows`)
      total += count
    } else {
      console.log(
        `[backfill] org ${org.id}: skipped (no rows or already chained)`
      )
    }
  }

  console.log(
    `[backfill] done — ${total} rows chained across ${orgs.length} orgs`
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[backfill] failed:", error)
    process.exit(1)
  })
