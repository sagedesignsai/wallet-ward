import {
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getR2Client, getR2Config } from "./r2-client"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PresignedUploadResult = {
  /** The presigned PUT URL the browser should upload to directly */
  uploadUrl: string
  /** The R2 object key — store this as `storageId` in the DB */
  storageKey: string
}

export type PresignedDownloadResult = {
  /** Time-limited GET URL for private file access */
  downloadUrl: string
  /** Expiry in seconds from now */
  expiresIn: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default presigned upload URL TTL: 15 minutes */
const UPLOAD_TTL_SECONDS = 60 * 15

/** Default presigned download URL TTL: 1 hour */
const DOWNLOAD_TTL_SECONDS = 60 * 60

/** Max presigned download TTL: 7 days (R2 hard limit) */
const MAX_DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 7

// ─── Upload Size Cap ──────────────────────────────────────────────────────────

/**
 * Max accepted upload size in bytes. Default 100 MB; override with
 * `R2_MAX_FILE_SIZE_MB` (NaN / non-positive values fall back to 100).
 * Shared by the /files/upload and /files/presign routes so both reject
 * oversized uploads before any bytes are buffered.
 */
export const MAX_FILE_SIZE = (() => {
  const mb = Number(process.env.R2_MAX_FILE_SIZE_MB ?? 100)
  return (Number.isFinite(mb) && mb > 0 ? mb : 100) * 1024 * 1024
})()

// ─── Presigned Upload ─────────────────────────────────────────────────────────

/**
 * Generate a presigned PUT URL so the browser can upload directly to R2
 * without routing file bytes through the Next.js server.
 *
 * Flow:
 *   1. Browser calls POST /api/v1/projects/:id/files/presign
 *   2. Server calls getPresignedUploadUrl() → returns { uploadUrl, storageKey }
 *   3. Browser PUTs the file to uploadUrl
 *   4. Browser calls POST /api/v1/projects/:id/files/confirm with storageKey
 *   5. Server writes the ProjectFile DB record
 *
 * @param storageKey  - The R2 object key (from buildObjectKey())
 * @param mimeType    - Content-Type header to enforce on upload
 * @param expiresIn   - TTL in seconds (default: 15 min)
 */
export async function getPresignedUploadUrl(
  storageKey: string,
  mimeType: string,
  expiresIn: number = UPLOAD_TTL_SECONDS
): Promise<PresignedUploadResult> {
  const client = getR2Client()
  const { bucket } = getR2Config()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: mimeType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn })

  return { uploadUrl, storageKey }
}

// ─── Presigned Download ───────────────────────────────────────────────────────

/**
 * Generate a time-limited presigned GET URL for downloading a private file.
 * Use this for `visibility: "private"` files instead of storing a permanent URL.
 *
 * For `visibility: "public"` files, use the public bucket URL instead.
 *
 * @param storageKey  - The R2 object key
 * @param expiresIn   - TTL in seconds (default: 1 hour, max: 7 days)
 */
export async function getPresignedDownloadUrl(
  storageKey: string,
  expiresIn: number = DOWNLOAD_TTL_SECONDS
): Promise<PresignedDownloadResult> {
  const client = getR2Client()
  const { bucket } = getR2Config()

  const ttl = Math.min(expiresIn, MAX_DOWNLOAD_TTL_SECONDS)

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  })

  const downloadUrl = await getSignedUrl(client, command, { expiresIn: ttl })

  return { downloadUrl, expiresIn: ttl }
}

// ─── Server-side Upload ───────────────────────────────────────────────────────

/**
 * Upload a buffer directly from the server to R2.
 * Use this for server-generated files (agent artifacts, exports, etc.)
 * where a presigned flow is not needed.
 *
 * For user-initiated uploads from the browser, prefer getPresignedUploadUrl().
 *
 * @param storageKey  - The R2 object key
 * @param body        - File content as a Buffer or Uint8Array
 * @param mimeType    - Content-Type for the object
 */
export async function uploadBuffer(
  storageKey: string,
  body: Buffer | Uint8Array,
  mimeType: string
): Promise<void> {
  const client = getR2Client()
  const { bucket } = getR2Config()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: body,
      ContentType: mimeType,
    })
  )
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete an object from R2. Called before deleting the ProjectFile DB record
 * to ensure storage is freed.
 *
 * R2 returns 204 even if the key does not exist, so this is safe to call
 * without checking first.
 *
 * @param storageKey  - The R2 object key (= ProjectFile.storageId)
 */
export async function deleteObject(storageKey: string): Promise<void> {
  const client = getR2Client()
  const { bucket } = getR2Config()

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    })
  )
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

/**
 * Copy an R2 object to a new key. Used when restoring a file version:
 * the historical version's object is copied under a new key so the new
 * version has its own independent storage entry.
 *
 * R2 does not have a native "rename" — copy + delete is the pattern.
 *
 * @param sourceKey  - The existing R2 object key to copy from
 * @param destKey    - The new R2 object key
 */
export async function copyObject(
  sourceKey: string,
  destKey: string
): Promise<void> {
  const client = getR2Client()
  const { bucket } = getR2Config()

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destKey,
    })
  )
}

// ─── Existence Check ──────────────────────────────────────────────────────────

export type ObjectHead = {
  exists: boolean
  /** ContentLength in bytes, when the object exists */
  size?: number
  /** Content-Type of the object, when the object exists */
  contentType?: string
}

function isNotFoundError(err: unknown): boolean {
  return (
    err instanceof Error &&
    ("$metadata" in err
      ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode === 404
      : err.name === "NotFound" || err.name === "NoSuchKey")
  )
}

/**
 * HEAD an object in R2 without downloading it. Returns the object's size and
 * content type so callers can verify the bytes that actually landed (e.g. the
 * /files/confirm route checks the real size against the client's claim).
 *
 * @param storageKey  - The R2 object key to check
 */
export async function headObject(storageKey: string): Promise<ObjectHead> {
  const client = getR2Client()
  const { bucket } = getR2Config()

  try {
    const res = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    )
    return {
      exists: true,
      size: res.ContentLength,
      contentType: res.ContentType,
    }
  } catch (err: unknown) {
    // R2 returns a 404 / NotFound when the key does not exist
    if (isNotFoundError(err)) return { exists: false }
    throw err
  }
}

/**
 * Check whether an object exists in R2 without downloading it.
 * Thin wrapper over headObject — metadata-only.
 *
 * @param storageKey  - The R2 object key to check
 * @returns true if the object exists, false if not found
 */
export async function objectExists(storageKey: string): Promise<boolean> {
  return (await headObject(storageKey)).exists
}

// ─── Public URL ───────────────────────────────────────────────────────────────

let warnedPublicUrl = false

/**
 * Build the permanent public URL for a file when `R2_PUBLIC_URL` is set
 * and the file has `visibility: "public"`.
 *
 * Returns null if no public URL is configured.
 *
 * @param storageKey  - The R2 object key
 */
export function getPublicUrl(storageKey: string): string | null {
  const { publicUrl } = getR2Config()
  if (!publicUrl) return null
  if (!warnedPublicUrl) {
    warnedPublicUrl = true
    console.warn(
      "[R2] R2_PUBLIC_URL is set. The shared bucket cannot enforce DB " +
        "visibility — every object would be fetchable by key. Keep this unset " +
        "until a dedicated public bucket ships."
    )
  }
  return `${publicUrl.replace(/\/$/, "")}/${storageKey}`
}
