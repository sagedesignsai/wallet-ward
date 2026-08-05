import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

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
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const { searchParams } = new URL(req.url)
    const path = searchParams.get("path") || "/"

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: { members: { where: { userId: session.user.id } } },
        },
      },
    })

    if (!project || project.organization.members.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const files = await FileService.listByProject(projectId, { path })

    return NextResponse.json({ data: files })
  } catch (error) {
    console.error("[files/folder GET] Error listing folder contents:", error)
    return NextResponse.json(
      { error: "Failed to list folder contents" },
      { status: 500 }
    )
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
