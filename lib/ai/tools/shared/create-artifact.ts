import { tool } from "ai"
import { z } from "zod"

// MIME types by file extension (lowercase, no leading dot). Used to derive
// the upload Content-Type when the caller does not pass mimeType explicitly.
const MIME_BY_EXT: Record<string, string> = {
  md: "text/markdown",
  txt: "text/plain",
  json: "application/json",
  yaml: "application/yaml",
  yml: "application/yaml",
  csv: "text/csv",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  ts: "application/typescript",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

function deriveMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  return MIME_BY_EXT[ext] ?? "application/octet-stream"
}

/**
 * Normalize a virtual directory path: default "/", ensure a leading slash,
 * and trim trailing slashes unless the path is the root itself.
 */
function normalizePath(path?: string): string {
  const trimmed = (path ?? "/").trim()
  if (!trimmed || trimmed === "/") return "/"
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return withLeading.length > 1 ? withLeading.replace(/\/+$/, "") : "/"
}

/**
 * Create Artifact Tool
 *
 * Creates files, media, office docs, configs, and assets in project storage.
 * Available to all agent types.
 */
export const createArtifactTool = tool({
  description:
    "Create an artifact (file, media, office document, config, or asset) in project storage. Provide UTF-8 text via 'content' or base64-encoded binary via 'contentBase64'.",
  inputSchema: z.object({
    projectId: z
      .string()
      .optional()
      .describe("The project ID. Defaults to the active project if omitted"),
    name: z
      .string()
      .describe("File name including extension, e.g. 'quarterly-report.pdf'"),
    content: z
      .string()
      .optional()
      .describe(
        "UTF-8 text content. Use for text files (md, txt, json, code). Mutually exclusive with contentBase64"
      ),
    contentBase64: z
      .string()
      .optional()
      .describe(
        "Base64-encoded binary content. Use for media and office docs (png, jpg, pdf, docx). Mutually exclusive with content"
      ),
    path: z
      .string()
      .optional()
      .describe("Virtual directory path, e.g. '/reports'. Defaults to '/'"),
    type: z
      .enum([
        "artifact",
        "document",
        "config",
        "asset",
        "code",
        "data",
        "other",
      ])
      .optional()
      .describe("Artifact type; defaults to 'other'"),
    tags: z.array(z.string()).optional(),
    visibility: z
      .enum(["private", "project", "public"])
      .optional()
      .describe("Visibility; defaults to 'private'"),
    mimeType: z
      .string()
      .optional()
      .describe("Content-Type; derived from the file extension when omitted"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
    userId: z.string(),
  }),
  execute: async (
    {
      projectId,
      name,
      content,
      contentBase64,
      path: rawPath,
      type,
      tags,
      visibility,
      mimeType,
    },
    { context }
  ) => {
    try {
      // 1. Resolve the project (explicit argument wins over context)
      const resolvedProjectId = projectId ?? context.projectId
      if (!resolvedProjectId) {
        throw new Error(
          "A projectId is required to create an artifact (pass it explicitly or run within a project context)"
        )
      }

      // 2. Exactly one of content / contentBase64 must be present
      const hasContent = content !== undefined
      const hasBase64 = contentBase64 !== undefined
      if (hasContent === hasBase64) {
        throw new Error("Provide exactly one of content or contentBase64")
      }

      // 3. Org-boundary check: the project must belong to the caller's org
      const { db } = await import("@/lib/db")
      const project = await db.project.findFirst({
        where: {
          id: resolvedProjectId,
          organizationId: context.organizationId,
        },
        select: { id: true },
      })
      if (!project) {
        throw new Error("Project not found")
      }

      // 4. Build the upload buffer
      const buffer = hasContent
        ? Buffer.from(content ?? "", "utf-8")
        : Buffer.from(contentBase64 ?? "", "base64")

      // 5. Enforce the shared upload size cap before touching storage
      const { uploadBuffer, buildObjectKey, getPublicUrl, MAX_FILE_SIZE } =
        await import("@/lib/storage")
      if (buffer.byteLength > MAX_FILE_SIZE) {
        throw new Error(
          `Artifact exceeds the maximum size of ${MAX_FILE_SIZE / (1024 * 1024)} MB`
        )
      }

      // 6. Resolve the MIME type: explicit param wins, else derive from ext
      const resolvedMimeType = mimeType ?? deriveMimeType(name)

      // 7. Upload to R2 under a server-minted, project-namespaced key
      const storageKey = buildObjectKey(resolvedProjectId, name)
      await uploadBuffer(storageKey, buffer, resolvedMimeType)

      // 8. Public URL only when explicitly requested — stays inactive by
      //    default (no shared-bucket public exposure unless opted in)
      const resolvedVisibility = visibility ?? "private"
      const url =
        resolvedVisibility === "public"
          ? (getPublicUrl(storageKey) ?? undefined)
          : undefined

      // 9. Normalize the virtual path
      const path = normalizePath(rawPath)

      // 10. Create the ProjectFile DB record
      const { FileService } = await import("@/lib/services/file-service")
      const file = await FileService.create({
        projectId: resolvedProjectId,
        name,
        path,
        type: type ?? "other",
        mimeType: resolvedMimeType,
        size: buffer.byteLength,
        storageId: storageKey,
        url,
        tags: tags ?? [],
        visibility: resolvedVisibility,
        createdById: context.userId,
      })

      // 11. Sanitized DTO — never expose storageId or the stored url
      return {
        id: file.id,
        name: file.name,
        path: file.path,
        type: file.type,
        mimeType: file.mimeType,
        size: file.size,
        version: file.version,
        tags: file.tags,
        visibility: file.visibility,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error("[create-artifact error]", error)
      throw new Error("Failed to create artifact. Please try again.")
    }
  },
})
