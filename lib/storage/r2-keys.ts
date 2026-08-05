import { randomUUID } from "crypto"

// ─── R2 Key Conventions ───────────────────────────────────────────────────────
//
// All object keys are namespaced by projectId to ensure complete isolation
// between projects in the same bucket:
//
//   {projectId}/{uniqueId}/{filename}
//
// The uniqueId segment prevents collisions if two files have the same name
// at the same path. The filename is normalized (no leading slash, URL-safe).
//
// Examples:
//   clx1abc.../f8e3-1234.../logo.png
//   clx1abc.../a1b2-5678.../config.yaml

/**
 * Normalise a filename so it is URL-safe and has no path separators.
 * Strips leading/trailing spaces and replaces any character that is not
 * alphanumeric, a hyphen, underscore, or dot with a hyphen.
 */
export function normaliseFilename(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Build the R2 object key for a new file upload.
 *
 * @param projectId  - The project that owns the file
 * @param filename   - The original filename (will be normalised)
 * @returns A deterministic, collision-resistant key like:
 *          `{projectId}/{uuid}/{filename}`
 */
export function buildObjectKey(projectId: string, filename: string): string {
  const uniqueId = randomUUID()
  // Fall back so all-special/non-ASCII names can't mint a key with an empty
  // filename segment (which would fail isValidProjectStorageKey).
  const safe = normaliseFilename(filename) || "file"
  return `${projectId}/${uniqueId}/${safe}`
}

/**
 * Build the R2 object key for a new version of an existing file.
 * The version key inherits the same filename but gets a new unique segment,
 * so previous versions remain accessible by their original key.
 *
 * @param projectId  - The project that owns the file
 * @param filename   - The filename for this version
 * @param version    - The numeric version (used as a readable prefix in the key)
 */
export function buildVersionKey(
  projectId: string,
  filename: string,
  version: number
): string {
  const uniqueId = randomUUID()
  // Fall back so all-special/non-ASCII names can't mint a key with an empty
  // filename segment (which would fail isValidProjectStorageKey).
  const safe = normaliseFilename(filename) || "file"
  return `${projectId}/v${version}-${uniqueId}/${safe}`
}

const UUID_SEGMENT =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

// {projectId}/{uuid}/{filename}   or   {projectId}/v{n}-{uuid}/{filename} (version keys)
const PROJECT_KEY_RE = new RegExp(
  `^[A-Za-z0-9_-]+/(?:v\\d+-)?${UUID_SEGMENT}/[A-Za-z0-9._-]+$`
)

/**
 * Validate that a storage key belongs to the given project and follows the
 * server-minted shape: `{projectId}/{uuid}/{filename}` or
 * `{projectId}/v{n}-{uuid}/{filename}`. normaliseFilename output is exactly
 * `[A-Za-z0-9._-]+` and randomUUID() matches UUID_SEGMENT, so keys built by
 * buildObjectKey/buildVersionKey always pass. Anything else (e.g. a weak
 * `foo/bar/baz` key, or a key from another project) is rejected.
 */
export function isValidProjectStorageKey(
  key: string,
  projectId: string
): boolean {
  return PROJECT_KEY_RE.test(key) && key.startsWith(`${projectId}/`)
}

/**
 * Derive the virtual "path" shown to users from an R2 object key.
 * This strips the {projectId}/{uniqueId}/ prefix to produce a clean path
 * like `/logo.png` that matches the `path` column in `ProjectFile`.
 *
 * Note: This is the reverse of what buildObjectKey does and is only used
 * when constructing path values from externally-provided keys.
 */
export function keyToDisplayPath(key: string): string {
  const parts = key.split("/")
  // [projectId, uniqueId, ...rest]
  if (parts.length < 3) return `/${key}`
  return `/${parts.slice(2).join("/")}`
}
