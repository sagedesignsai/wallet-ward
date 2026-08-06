import {
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  sign,
  verify,
} from "node:crypto"

const ALGO = "aes-256-gcm"
const IV_LENGTH = 12
const KEY_LENGTH = 32

export type EncryptedPayload = {
  ciphertext: string
  iv: string
  authTag: string
  algorithm: typeof ALGO
}

function getMasterKey(): Buffer {
  const raw = process.env.MASTER_KEY
  if (!raw) {
    throw new Error("MASTER_KEY is not set")
  }

  // Accept base64 or hex
  let key: Buffer
  try {
    key = Buffer.from(raw, "base64")
    if (key.length !== KEY_LENGTH) {
      key = Buffer.from(raw, "hex")
    }
  } catch {
    throw new Error("MASTER_KEY must be base64 or hex encoded 32-byte key")
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `MASTER_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length})`
    )
  }

  return key
}

export function generateDataKey(): Buffer {
  return randomBytes(KEY_LENGTH)
}

export function wrapDataKey(dek: Buffer): EncryptedPayload {
  return encryptBuffer(dek, getMasterKey())
}

export function unwrapDataKey(payload: EncryptedPayload): Buffer {
  return decryptBuffer(payload, getMasterKey())
}

export function encryptString(
  plaintext: string,
  dek: Buffer
): EncryptedPayload {
  return encryptBuffer(Buffer.from(plaintext, "utf8"), dek)
}

export function decryptString(payload: EncryptedPayload, dek: Buffer): string {
  return decryptBuffer(payload, dek).toString("utf8")
}

export function encryptBuffer(data: Buffer, key: Buffer): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    algorithm: ALGO,
  }
}

export function decryptBuffer(payload: EncryptedPayload, key: Buffer): Buffer {
  const decipher = createDecipheriv(
    ALGO,
    key,
    Buffer.from(payload.iv, "base64")
  )
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ])
}

// ─── Ed25519 audit signing helpers ───────────────────────────────────────────
//
// Contract (pinned): privateKey is exported as PKCS8 DER base64; publicKey as
// SPKI DER base64. Signatures are Ed25519 over the RAW 32-byte digest (the
// hex-decoded SHA-256), never over hex/ASCII text. DER signatures are base64.

export type AuditSigningKeyPair = {
  publicKey: string
  privateKey: string
}

export function generateAuditSigningKeyPair(): AuditSigningKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  })

  return {
    publicKey: publicKey.toString("base64"),
    privateKey: privateKey.toString("base64"),
  }
}

export function signAuditDigest(
  privateKeyPkcs8DerB64: string,
  digest: Buffer
): string {
  const key = createPrivateKey({
    key: Buffer.from(privateKeyPkcs8DerB64, "base64"),
    type: "pkcs8",
    format: "der",
  })
  return sign(null, digest, key).toString("base64")
}

export function verifyAuditDigest(
  publicKeySpkiDerB64: string,
  digest: Buffer,
  signatureB64: string
): boolean {
  const key = createPublicKey({
    key: Buffer.from(publicKeySpkiDerB64, "base64"),
    type: "spki",
    format: "der",
  })
  return verify(null, digest, key, Buffer.from(signatureB64, "base64"))
}
