import { NextRequest } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { requireProjectAccess } from "@/lib/api/project-access"
import { notFound } from "@/lib/api/errors"
import { handleRouteError, json } from "@/lib/api/http"

/**
 * POST /api/v1/projects/:projectId/files/:fileId/share
 * Create a shareable link for a file (creates a FileShare record — a
 * mutation, so it requires project:write, matching sibling file routes).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params
    const { ctx } = await requireProjectAccess(projectId, "project:write")

    // Verify file exists and belongs to project
    const file = await FileService.getById(fileId)
    if (!file || file.projectId !== projectId) {
      throw notFound("File not found")
    }

    const body = await req.json()

    const share = await FileService.createShare({
      fileId,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      maxDownloads: body.maxDownloads,
      createdById: ctx.userId,
    })

    return json({ data: share }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
