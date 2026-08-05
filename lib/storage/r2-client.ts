import { S3Client } from "@aws-sdk/client-s3"

// ─── Config validation ────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[R2] Missing required environment variable: ${name}. ` +
        `Check your .env file and ensure all R2_* variables are set.`
    )
  }
  return value
}

export type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  /** Optional public CDN URL for public-visibility files, e.g. https://cdn.example.com */
  publicUrl: string | null
}

/**
 * Reads and validates the R2 configuration from environment variables.
 * Throws a descriptive error at startup if any required variable is missing.
 */
export function getR2Config(): R2Config {
  return {
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("R2_BUCKET_NAME"),
    publicUrl: process.env.R2_PUBLIC_URL ?? null,
  }
}

// ─── Singleton S3Client ───────────────────────────────────────────────────────

let _client: S3Client | null = null

/**
 * Returns the S3Client singleton configured for Cloudflare R2.
 * The client is lazily created on first access and reused across requests.
 *
 * R2 is S3-compatible; the only difference from AWS S3 is the endpoint URL:
 *   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 */
export function getR2Client(): S3Client {
  if (_client) return _client

  const config = getR2Config()

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return _client
}
