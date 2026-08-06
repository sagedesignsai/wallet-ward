import { NextRequest } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { writeAuditLog } from "@/lib/services/audit"
import { deleteObject } from "@/lib/storage"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"
import { notFound } from "@/lib/api/errors"
import type { FileType, FileVisibility } from "@prisma/client"

/**
 * GET /api/v1/projects/:projectId/files/:fileId
 * Get a specific file (with version list and counts)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params
    await requireProjectAccess(projectId, "project:read")

    const file = await FileService.getByIdWithVersions(fileId)
    if (!file || file.projectId !== projectId) {
      throw notFound("File not found")
    }

    return json({ data: file })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * PATCH /api/v1/projects/:projectId/files/:fileId
 * Update file metadata (name, path, type, tags, visibility)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params
    const { ctx, project } = await requireProjectAccess(
      projectId,
      "project:write"
    )

    const existingFile = await FileService.getById(fileId)
    if (!existingFile || existingFile.projectId !== projectId) {
      throw notFound("File not found")
    }

    const body = await req.json()
    const file = await FileService.update(fileId, {
      name: body.name,
      path: body.path,
      type: body.type as FileType,
      tags: body.tags,
      metadata: body.metadata,
      visibility: body.visibility as FileVisibility,
    })

    await writeAuditLog({
      ctx,
      organizationId: project.organizationId,
      action: "project_update",
      resourceType: "file",
      resourceId: file.id,
      metadata: {
        action: "update",
        projectId,
        fileName: file.name,
        changes: body,
      },
    })

    return json({ data: file })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * DELETE /api/v1/projects/:projectId/files/:fileId
 *
 * Deletes the R2 object first, then removes the DB record.
 * If the R2 delete fails, the DB record is preserved so the operator can
 * retry or manually clean up storage. This prevents ghost DB records that
 * point to non-existent objects.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params
    const { ctx, project } = await requireProjectAccess(
      projectId,
      "project:write"
    )

    const existingFile = await FileService.getById(fileId)
    if (!existingFile || existingFile.projectId !== projectId) {
      throw notFound("File not found")
    }

    // Step 1: Delete R2 object. R2 is idempotent on missing keys (returns 204),
    // so if the object was already gone this is safe.
    await deleteObject(existingFile.storageId)

    // Step 2: Delete DB record (cascades to FileShare)
    await FileService.delete(fileId)

    await writeAuditLog({
      ctx,
      organizationId: project.organizationId,
      action: "project_update",
      resourceType: "file",
      resourceId: fileId,
      metadata: {
        action: "delete",
        projectId,
        fileName: existingFile.name,
        storageKey: existingFile.storageId,
      },
    })

    return json({ data: { ok: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
