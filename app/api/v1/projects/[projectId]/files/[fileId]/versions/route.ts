import { NextRequest } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { requireProjectAccess } from "@/lib/api/project-access"
import { notFound } from "@/lib/api/errors"
import { handleRouteError, json } from "@/lib/api/http"

/**
 * GET /api/v1/projects/:projectId/files/:fileId/versions
 * List all versions of a file
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params

    await requireProjectAccess(projectId, "project:read")

    // Verify file exists and belongs to project
    const file = await FileService.getById(fileId)
    if (!file || file.projectId !== projectId) {
      throw notFound("File not found")
    }

    const versions = await FileService.getVersions(fileId)

    return json({ data: versions })
  } catch (error) {
    return handleRouteError(error)
  }
}
