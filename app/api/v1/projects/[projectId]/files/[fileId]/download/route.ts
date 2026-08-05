import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { FileService } from "@/lib/services/file-service"
import { getPresignedDownloadUrl } from "@/lib/storage"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError } from "@/lib/api/http"
import { notFound } from "@/lib/api/errors"

/**
 * GET /api/v1/projects/:projectId/files/:fileId/download
 * Download a file or redirect to its URL
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params
    const { ctx, project } = await requireProjectAccess(
      projectId,
      "project:read"
    )

    // Verify file exists and belongs to project
    const file = await FileService.getById(fileId)
    if (!file || file.projectId !== projectId) {
      throw notFound("File not found")
    }

    // R2-backed files store their object key in storageId — sign a
    // time-limited download URL so private objects are never exposed by key.
    if (file.storageId) {
      const { downloadUrl } = await getPresignedDownloadUrl(file.storageId)

      // Audit log the download
      await db.auditLog.create({
        data: {
          organizationId: project.organizationId,
          actorUserId: ctx.userId,
          action: "project_update",
          resourceType: "file",
          resourceId: fileId,
          metadata: {
            action: "download",
            projectId,
            fileName: file.name,
          },
        },
      })

      return NextResponse.redirect(downloadUrl)
    }

    // Legacy/externally-hosted files redirect to their stored URL
    if (file.url) {
      // Audit log the download
      await db.auditLog.create({
        data: {
          organizationId: project.organizationId,
          actorUserId: ctx.userId,
          action: "project_update",
          resourceType: "file",
          resourceId: fileId,
          metadata: {
            action: "download",
            projectId,
            fileName: file.name,
          },
        },
      })

      return NextResponse.redirect(file.url)
    }

    // No storage object and no stored URL — nothing to download
    throw notFound("File not available for download")
  } catch (error) {
    return handleRouteError(error)
  }
}
