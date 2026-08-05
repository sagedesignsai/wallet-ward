import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { FileService } from "@/lib/services/file-service"
import {
  uploadBuffer,
  buildObjectKey,
  getPublicUrl,
  MAX_FILE_SIZE,
} from "@/lib/storage"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"
import { ApiError, badRequest, notFound } from "@/lib/api/errors"
import type { FileType, FileVisibility } from "@prisma/client"

/**
 * POST /api/v1/projects/:projectId/files/upload
 *
 * Server-side multipart upload route. The file bytes arrive at this endpoint,
 * are streamed to R2, and a ProjectFile DB record is created.
 *
 * Use this for programmatic/agent uploads or small files where the two-step
 * presigned flow isn't needed.
 *
 * For browser uploads of large files, use the presign + confirm flow:
 *   POST /files/presign  →  browser PUT to R2  →  POST /files/confirm
 *
 * Form fields:
 *   file        File    (required) — the binary
 *   name        string  (optional) — display name; defaults to file.name
 *   path        string  (optional) — virtual path; defaults to "/{file.name}"
 *   type        string  (optional) — FileType enum value; defaults to "other"
 *   tags        string  (optional) — comma-separated list
 *   visibility  string  (optional) — "private" | "project" | "public"; defaults to "private"
 *   parentId    string  (optional) — ID of the parent file (new version upload)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { ctx, project } = await requireProjectAccess(
      projectId,
      "project:write"
    )

    const formData = await req.formData()
    const fileField = formData.get("file") as File | null

    if (!fileField) {
      throw badRequest("No file provided")
    }

    // Enforce the size cap BEFORE buffering any bytes — a self-hosted Node
    // server has no request body cap, so an unbounded arrayBuffer() read is
    // an OOM risk.
    if (fileField.size > MAX_FILE_SIZE) {
      throw new ApiError(413, "payload_too_large", "File exceeds maximum size")
    }

    const displayName = (formData.get("name") as string) || fileField.name
    const virtualPath = (formData.get("path") as string) || `/${fileField.name}`
    const type = ((formData.get("type") as string) || "other") as FileType
    const tags = (formData.get("tags") as string)
      ? (formData.get("tags") as string)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : []
    const visibility = ((formData.get("visibility") as string) ||
      "private") as FileVisibility
    const parentId = (formData.get("parentId") as string) || null
    const mimeType = fileField.type || "application/octet-stream"

    // Build the R2 key and upload the bytes
    const storageKey = buildObjectKey(projectId, fileField.name)
    const buffer = Buffer.from(await fileField.arrayBuffer())

    await uploadBuffer(storageKey, buffer, mimeType)

    // Resolve public URL if applicable
    const url =
      visibility === "public"
        ? (getPublicUrl(storageKey) ?? undefined)
        : undefined

    let file

    if (parentId) {
      // New version of an existing file
      const parent = await FileService.getById(parentId)
      if (!parent || parent.projectId !== projectId) {
        throw notFound("Parent file not found")
      }

      file = await FileService.createVersion(parentId, {
        projectId,
        name: displayName,
        path: virtualPath.startsWith("/") ? virtualPath : `/${virtualPath}`,
        type,
        mimeType,
        size: fileField.size,
        storageId: storageKey,
        url,
        tags,
        visibility,
        createdById: ctx.userId,
      })
    } else {
      file = await FileService.create({
        projectId,
        name: displayName,
        path: virtualPath.startsWith("/") ? virtualPath : `/${virtualPath}`,
        type,
        mimeType,
        size: fileField.size,
        storageId: storageKey,
        url,
        tags,
        visibility,
        createdById: ctx.userId,
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: ctx.userId,
        action: "project_update",
        resourceType: "file",
        resourceId: file.id,
        metadata: {
          action: parentId ? "upload_version" : "upload",
          projectId,
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          storageKey,
        },
      },
    })

    return json({ data: file }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
