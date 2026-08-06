import type { AuditSigningKey } from "@prisma/client"
import {
  decryptString,
  encryptString,
  generateAuditSigningKeyPair,
  signAuditDigest,
  type EncryptedPayload,
} from "@/lib/crypto"
import { prisma } from "@/lib/db"
import { getOrganizationDek } from "@/lib/services/encryption-keys"

// Per-org Ed25519 signing keys for the audit chain. The private key is
// wrapped with the org DEK (AES-256-GCM via encryptString) and never stored
// or logged in plaintext. Key resolution mirrors encryption-keys.ts.

async function createAuditSigningKey(
  organizationId: string,
  keyVersion: number
): Promise<AuditSigningKey> {
  const dek = await getOrganizationDek(organizationId)
  const pair = generateAuditSigningKeyPair()
  const wrapped = encryptString(pair.privateKey, dek)

  return prisma.auditSigningKey.create({
    data: {
      organizationId,
      keyVersion,
      publicKey: pair.publicKey,
      privateKeyEncrypted: JSON.stringify(wrapped as EncryptedPayload),
    },
  })
}

export async function ensureAuditSigningKey(
  organizationId: string
): Promise<AuditSigningKey> {
  const existing = await prisma.auditSigningKey.findFirst({
    where: { organizationId, active: true },
    orderBy: { keyVersion: "desc" },
  })

  if (existing) {
    return existing
  }

  return createAuditSigningKey(organizationId, 1)
}

export async function getAuditSigningKey(
  organizationId: string,
  keyVersion?: number
): Promise<AuditSigningKey | null> {
  if (keyVersion != null) {
    return prisma.auditSigningKey.findUnique({
      where: {
        organizationId_keyVersion: {
          organizationId,
          keyVersion,
        },
      },
    })
  }

  const active = await prisma.auditSigningKey.findFirst({
    where: { organizationId, active: true },
    orderBy: { keyVersion: "desc" },
  })

  if (active) {
    return active
  }

  // No active key: fall back to the newest (possibly retired) key so history
  // stays verifiable even after rotation retires the last one.
  return prisma.auditSigningKey.findFirst({
    where: { organizationId },
    orderBy: { keyVersion: "desc" },
  })
}

export async function getAuditSigningKeyById(
  signingKeyId: string
): Promise<AuditSigningKey | null> {
  return prisma.auditSigningKey.findUnique({ where: { id: signingKeyId } })
}

export async function rotateAuditSigningKey(
  organizationId: string
): Promise<AuditSigningKey> {
  const current = await ensureAuditSigningKey(organizationId)

  await prisma.auditSigningKey.updateMany({
    where: { organizationId, active: true },
    data: { active: false, retiredAt: new Date() },
  })

  return createAuditSigningKey(organizationId, current.keyVersion + 1)
}

export async function signAuditHash(
  organizationId: string,
  digest: Buffer
): Promise<{ signature: string; signingKeyId: string }> {
  const key = await ensureAuditSigningKey(organizationId)
  const dek = await getOrganizationDek(organizationId)
  const payload = JSON.parse(key.privateKeyEncrypted) as EncryptedPayload
  const privateKey = decryptString(payload, dek)
  const signature = signAuditDigest(privateKey, digest)

  return { signature, signingKeyId: key.id }
}

export type AuditSigningKeyInfo = {
  id: string
  keyVersion: number
  publicKey: string
  active: boolean
  retiredAt: Date | null
}

export async function listSigningKeys(
  organizationId: string
): Promise<AuditSigningKeyInfo[]> {
  return prisma.auditSigningKey.findMany({
    where: { organizationId },
    orderBy: { keyVersion: "asc" },
    select: {
      id: true,
      keyVersion: true,
      publicKey: true,
      active: true,
      retiredAt: true,
    },
  })
}
