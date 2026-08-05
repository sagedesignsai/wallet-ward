import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { FileService } from "@/lib/services/file-service"
import { copyObject, buildVersionKey } from "@/lib/storage"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"
import { notFound } from "@/lib/api/errors"

/**
 * POST /api/v1/projects/:projectId/files/:fileId/restore/:versionId
 *
 * Restore a file to a specific historical version.
 *
 * What happens:
 *   1. The target version's R2 object is copied to a new key
 *      (preserves both the historical version and the new "current" version
 *       as separate, independent objects in R2)
 *   2. A new ProjectFile record is created pointing at the new R2 key,
 *      with version = current.version + 1
 *
 * The original version record and its R2 object are never mutated.
 */
export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; fileId: string; versionId: string }>
  }
) {
  try {
    const { projectId, fileId, versionId } = await params
    const { ctx, project } = await requireProjectAccess(
      projectId,
      "project:write"
    )

    const currentFile = await FileService.getById(fileId)
    if (!currentFile || currentFile.projectId !== projectId) {
      throw notFound("File not found")
    }

    // The version must belong to the same project AND be part of this file's
    // chain (this file itself, or one of its version rows — every version row
    // has parentId = the root fileId). Accepting any same-project file as a
    // "version" would let a caller copy another file's object into this one.
    const versionFile = await FileService.getById(versionId)
    if (
      !versionFile ||
      versionFile.projectId !== projectId ||
      (versionFile.id !== fileId && versionFile.parentId !== fileId)
    ) {
      throw notFound("Version not found")
    }

    // Build a new unique R2 key for the restored version so it has its own
    // independent storage entry
    const newVersion = currentFile.version + 1
    const newStorageKey = buildVersionKey(
      projectId,
      versionFile.name,
      newVersion
    )

    // Copy the historical version's R2 object to the new key
    await copyObject(versionFile.storageId, newStorageKey)

    // Create the new DB record with the new key. Do not carry over the
    // version's stored url — it may be a dead or private presigned URL.
    const restored = await FileService.restoreVersionWithKey(
      fileId,
      versionId,
      newStorageKey,
      ctx.userId,
      undefined
    )

    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: ctx.userId,
        action: "project_update",
        resourceType: "file",
        resourceId: fileId,
        metadata: {
          action: "restore_version",
          projectId,
          fileName: currentFile.name,
          restoredFromVersionId: versionId,
          newVersion: restored.version,
          newStorageKey,
        },
      },
    })

    return json({ data: restored })
  } catch (error) {
    return handleRouteError(error)
  }
}
