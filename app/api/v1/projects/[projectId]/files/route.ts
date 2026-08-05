import { NextRequest } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"
import type { FileType } from "@prisma/client"

/**
 * GET /api/v1/projects/:projectId/files
 * List all files for a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(req.url)

    await requireProjectAccess(projectId, "project:read")

    const type = searchParams.get("type") as FileType | null
    const path = searchParams.get("path")
    const tags = searchParams.get("tags")?.split(",")

    const files = await FileService.listByProjectWithMetadata(projectId, {
      type: type || undefined,
      path: path || undefined,
      tags: tags || undefined,
    })

    return json({ data: files })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST is no longer supported.
 * File records are created through the presign + confirm flow (or the
 * server-side /files/upload route) — there is no metadata-only create path.
 */
export async function POST() {
  return json(
    {
      error:
        "Direct file creation is not supported. Use POST /files/presign followed by POST /files/confirm, or POST /files/upload.",
    },
    { status: 410 }
  )
}
