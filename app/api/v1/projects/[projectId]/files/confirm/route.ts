import { NextRequest } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { writeAuditLog } from "@/lib/services/audit"
import {
  headObject,
  getPublicUrl,
  isValidProjectStorageKey,
} from "@/lib/storage"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"
import { ApiError, badRequest, notFound } from "@/lib/api/errors"
import type { FileType, FileVisibility } from "@prisma/client"

/**
 * POST /api/v1/projects/:projectId/files/confirm
 *
 * Step 2 of the two-step presigned upload flow.
 * Called after the browser has PUT the file to R2 via the presigned URL.
 *
 * Verifies the object actually exists in R2 (guards against phantom confirms)
 * and that its real size matches the claimed size, then writes the ProjectFile
 * DB record using the real size from storage.
 *
 * Request body:
 *   {
 *     storageKey: string       // from the /presign response
 *     name: string             // display name
 *     path: string             // virtual path, e.g. "/assets/logo.png"
 *     type: FileType
 *     mimeType: string
 *     size: number
 *     tags?: string[]
 *     visibility?: FileVisibility   // default: "private"
 *     metadata?: Record<string, unknown>
 *     // versioning (optional)
 *     parentId?: string        // if this is a new version of an existing file
 *   }
 *
 * Response:
 *   { data: ProjectFile }
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

    const body = await req.json()
    const {
      storageKey,
      name,
      path,
      type,
      mimeType,
      size,
      tags,
      visibility = "private",
      metadata,
      parentId,
    } = body

    // Validate required fields
    if (!storageKey || !name || !path || !type || !mimeType) {
      throw badRequest(
        "Missing required fields: storageKey, name, path, type, mimeType"
      )
    }

    // The storageKey must be a server-minted key for THIS project. Accepting
    // arbitrary keys (e.g. "foo/bar/baz") would let a caller write DB records
    // pointing at any object in the shared bucket.
    if (!isValidProjectStorageKey(storageKey, projectId)) {
      throw badRequest("Invalid storageKey")
    }

    // Verify the object actually landed in R2 before writing the DB record.
    // This prevents phantom file records from failed or spoofed uploads.
    const meta = await headObject(storageKey)
    if (!meta.exists) {
      throw new ApiError(
        422,
        "unprocessable_entity",
        "Upload not found in storage. Ensure the file was uploaded to the presigned URL before calling confirm."
      )
    }

    // Verify the actual uploaded size matches what the client claimed. The
    // browser sets Content-Length from the real bytes, so this catches
    // truncated or spoofed uploads. Skipped when HEAD gives no size.
    if (
      typeof body.size === "number" &&
      meta.size !== undefined &&
      body.size !== meta.size
    ) {
      throw new ApiError(422, "unprocessable_entity", "Size mismatch")
    }

    // Resolve the public URL if the file is public and a CDN is configured
    const url =
      visibility === "public"
        ? (getPublicUrl(storageKey) ?? undefined)
        : undefined

    // Persist the real size from storage, not the client's claim
    const realSize = meta.size ?? size ?? 0

    let file

    if (parentId) {
      // New version of an existing file
      const parent = await FileService.getById(parentId)
      if (!parent || parent.projectId !== projectId) {
        throw notFound("Parent file not found")
      }

      file = await FileService.createVersion(parentId, {
        projectId,
        name,
        path,
        type: type as FileType,
        mimeType,
        size: realSize,
        storageId: storageKey,
        url,
        tags: tags ?? [],
        visibility: visibility as FileVisibility,
        metadata,
        createdById: ctx.userId,
      })
    } else {
      // Brand-new file
      file = await FileService.create({
        projectId,
        name,
        path: path.startsWith("/") ? path : `/${path}`,
        type: type as FileType,
        mimeType,
        size: realSize,
        storageId: storageKey,
        url,
        tags: tags ?? [],
        visibility: visibility as FileVisibility,
        metadata,
        createdById: ctx.userId,
      })
    }

    // Audit log
    await writeAuditLog({
      ctx,
      organizationId: project.organizationId,
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
    })

    return json({ data: file }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
