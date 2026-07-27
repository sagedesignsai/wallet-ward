import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
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
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const { searchParams } = new URL(req.url)

    const q = searchParams.get("q")
    const type = searchParams.get("type") as FileType | null
    const tags = searchParams.get("tags")?.split(",")

    if (!q) {
      return NextResponse.json(
        { error: "Search query 'q' is required" },
        { status: 400 }
      )
    }

    // Verify project access
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!project || project.organization.members.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const files = await FileService.search(projectId, q, {
      type: type || undefined,
      tags: tags || undefined,
    })

    return NextResponse.json({ data: files })
  } catch (error) {
    console.error("Error searching files:", error)
    return NextResponse.json(
      { error: "Failed to search files" },
      { status: 500 }
    )
  }
}
