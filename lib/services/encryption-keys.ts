import {
  generateDataKey,
  unwrapDataKey,
  wrapDataKey,
  type EncryptedPayload,
} from "@/lib/crypto"
import { prisma } from "@/lib/db"

const dekCache = new Map<string, { dek: Buffer; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

export async function ensureOrganizationDek(
  organizationId: string
): Promise<Buffer> {
  const existing = await prisma.organizationEncryptionKey.findUnique({
    where: { organizationId },
  })

  if (existing) {
    return unwrapDataKey({
      ciphertext: existing.wrappedDek,
      iv: existing.wrapIv,
      authTag: existing.wrapAuthTag,
      algorithm: "aes-256-gcm",
    })
  }

  const dek = generateDataKey()
  const wrapped = wrapDataKey(dek)

  await prisma.organizationEncryptionKey.create({
    data: {
      organizationId,
      wrappedDek: wrapped.ciphertext,
      wrapIv: wrapped.iv,
      wrapAuthTag: wrapped.authTag,
      algorithm: wrapped.algorithm,
      keyVersion: 1,
    },
  })

  return dek
}

export async function getOrganizationDek(
  organizationId: string
): Promise<Buffer> {
  const cached = dekCache.get(organizationId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.dek
  }

  const record = await prisma.organizationEncryptionKey.findUnique({
    where: { organizationId },
  })

  if (!record) {
    const dek = await ensureOrganizationDek(organizationId)
    dekCache.set(organizationId, {
      dek,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })
    return dek
  }

  const payload: EncryptedPayload = {
    ciphertext: record.wrappedDek,
    iv: record.wrapIv,
    authTag: record.wrapAuthTag,
    algorithm: "aes-256-gcm",
  }

  const dek = unwrapDataKey(payload)
  dekCache.set(organizationId, {
    dek,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
  return dek
}
