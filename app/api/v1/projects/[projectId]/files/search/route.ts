import { NextRequest } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { requireProjectAccess } from "@/lib/api/project-access"
import { badRequest } from "@/lib/api/errors"
import { handleRouteError, json } from "@/lib/api/http"
import type { FileType } from "@prisma/client"

/**
 * GET /api/v1/projects/:projectId/files/search
 * Search files by query string, type, and tags
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(req.url)

    const q = searchParams.get("q")
    const type = searchParams.get("type") as FileType | null
    const tags = searchParams.get("tags")?.split(",")

    if (!q) {
      throw badRequest("Search query 'q' is required")
    }

    await requireProjectAccess(projectId, "project:read")

    const files = await FileService.search(projectId, q, {
      type: type || undefined,
      tags: tags || undefined,
    })

    return json({ data: files })
  } catch (error) {
    return handleRouteError(error)
  }
}
