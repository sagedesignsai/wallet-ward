/**
 * lib/storage — Cloudflare R2 object storage
 *
 * Modules:
 *   r2-client      — S3Client singleton and config validation
 *   r2-keys        — Object key construction and path utilities
 *   r2-operations  — Upload, download, delete, copy, existence check
 *
 * Import from this barrel in API routes and services:
 *   import { getPresignedUploadUrl, deleteObject, buildObjectKey } from "@/lib/storage"
 */

// Client & config
export { getR2Client, getR2Config } from "./r2-client"
export type { R2Config } from "./r2-client"

// Key utilities
export {
  buildObjectKey,
  buildVersionKey,
  normaliseFilename,
  extractProjectId,
  isValidProjectStorageKey,
  keyToDisplayPath,
} from "./r2-keys"

// Operations
export {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  uploadBuffer,
  deleteObject,
  copyObject,
  objectExists,
  headObject,
  getPublicUrl,
  MAX_FILE_SIZE,
} from "./r2-operations"
export type {
  PresignedUploadResult,
  PresignedDownloadResult,
  ObjectHead,
} from "./r2-operations"
