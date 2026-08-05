import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { requireProjectAccess } from "@/lib/api/project-access"
import { handleRouteError, json } from "@/lib/api/http"

/**
 * GET /api/v1/projects/:projectId/files/folder?path=/some/prefix
 *
 * List files whose path starts with the given prefix.
 * Folders are not stored as DB records — they are inferred from file paths.
 * This endpoint is the primary way to browse a virtual directory.
 *
 * Query params:
 *   path  string  (optional, default "/") — the directory prefix to list
 *
 * POST /files/folder has been intentionally removed.
 * Folders are path-as-structure: a "folder" exists as long as any file's
 * path starts with that prefix. No placeholder records are needed or stored.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(req.url)
    const path = searchParams.get("path") || "/"

    await requireProjectAccess(projectId, "project:read")

    const files = await FileService.listByProject(projectId, { path })

    return json({ data: files })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST is no longer supported.
 * Folders do not exist as DB records — they are derived from file paths.
 * To "create" a folder, upload any file with a path under that prefix.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Creating folder records is not supported. Folders are derived from file paths. Upload a file with the desired path prefix instead.",
    },
    { status: 410 }
  )
}
