import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * POST /api/v1/projects/:projectId/files/:fileId/share
 * Create a shareable link for a file
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, fileId } = await params

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

    // Verify file exists and belongs to project
    const file = await FileService.getById(fileId)
    if (!file || file.projectId !== projectId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const body = await req.json()

    const share = await FileService.createShare({
      fileId,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      maxDownloads: body.maxDownloads,
      createdById: session.user.id,
    })

    return NextResponse.json({ data: share }, { status: 201 })
  } catch (error) {
    console.error("Error creating file share:", error)
    return NextResponse.json(
      { error: "Failed to create file share" },
      { status: 500 }
    )
  }
}
