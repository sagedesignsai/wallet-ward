import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * POST /api/v1/projects/:projectId/files/folder
 * Create a virtual folder (placeholder file record with type "other")
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

    if (!body.name || !body.path) {
      return NextResponse.json(
        { error: "Missing required fields: name, path" },
        { status: 400 }
      )
    }

    // Create a placeholder file record representing a virtual folder
    const folder = await FileService.create({
      projectId,
      name: body.name,
      path: body.path,
      type: "other",
      mimeType: "application/x-directory",
      size: 0,
      storageId: crypto.randomUUID(),
      tags: [],
      visibility: "private",
      metadata: { isFolder: true },
      createdById: session.user.id,
    })

    // Audit log the folder creation
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "file",
        resourceId: folder.id,
        metadata: {
          action: "create_folder",
          projectId,
          folderName: folder.name,
          folderPath: folder.path,
        },
      },
    })

    return NextResponse.json({ data: folder }, { status: 201 })
  } catch (error) {
    console.error("Error creating folder:", error)
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/projects/:projectId/files/folder
 * List folder contents (files matching a path prefix)
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

    const files = await FileService.listByProject(projectId, {
      path,
    })

    return NextResponse.json({ data: files })
  } catch (error) {
    console.error("Error listing folder contents:", error)
    return NextResponse.json(
      { error: "Failed to list folder contents" },
      { status: 500 }
    )
  }
}
