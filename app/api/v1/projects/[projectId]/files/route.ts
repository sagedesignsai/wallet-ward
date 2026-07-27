import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { FileType, FileVisibility } from "@prisma/client"

/**
 * GET /api/v1/projects/:projectId/files
 * List all files for a project
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

    const type = searchParams.get("type") as FileType | null
    const path = searchParams.get("path")
    const tags = searchParams.get("tags")?.split(",")

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

    const files = await FileService.listByProjectWithMetadata(projectId, {
      type: type || undefined,
      path: path || undefined,
      tags: tags || undefined,
    })

    return NextResponse.json({ data: files })
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/projects/:projectId/files
 * Create a new file (metadata only, actual upload handled separately)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

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

    const body = await req.json()

    // Validate required fields
    if (
      !body.name ||
      !body.path ||
      !body.type ||
      !body.mimeType ||
      !body.size ||
      !body.storageId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, path, type, mimeType, size, storageId",
        },
        { status: 400 }
      )
    }

    const file = await FileService.create({
      projectId,
      name: body.name,
      path: body.path,
      type: body.type as FileType,
      mimeType: body.mimeType,
      size: body.size,
      storageId: body.storageId,
      url: body.url,
      tags: body.tags,
      metadata: body.metadata,
      visibility: (body.visibility as FileVisibility) || "private",
      createdById: session.user.id,
    })

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "file",
        resourceId: file.id,
        metadata: {
          action: "create",
          projectId,
          fileName: file.name,
          fileType: file.type,
          size: file.size,
        },
      },
    })

    return NextResponse.json({ data: file }, { status: 201 })
  } catch (error) {
    console.error("Error creating file:", error)
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    )
  }
}
