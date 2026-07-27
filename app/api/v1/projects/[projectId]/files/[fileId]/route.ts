import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { FileType, FileVisibility } from "@prisma/client"

/**
 * GET /api/v1/projects/:projectId/files/:fileId
 * Get a specific file
 */
export async function GET(
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

    const file = await FileService.getByIdWithVersions(fileId)

    if (!file || file.projectId !== projectId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ data: file })
  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/projects/:projectId/files/:fileId
 * Update a file
 */
export async function PATCH(
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
    const existingFile = await FileService.getById(fileId)
    if (!existingFile || existingFile.projectId !== projectId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const body = await req.json()

    const file = await FileService.update(fileId, {
      name: body.name,
      path: body.path,
      type: body.type as FileType,
      tags: body.tags,
      metadata: body.metadata,
      visibility: body.visibility as FileVisibility,
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
          action: "update",
          projectId,
          fileName: file.name,
          changes: body,
        },
      },
    })

    return NextResponse.json({ data: file })
  } catch (error) {
    console.error("Error updating file:", error)
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/projects/:projectId/files/:fileId
 * Delete a file
 */
export async function DELETE(
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
    const existingFile = await FileService.getById(fileId)
    if (!existingFile || existingFile.projectId !== projectId) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    await FileService.delete(fileId)

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "file",
        resourceId: fileId,
        metadata: {
          action: "delete",
          projectId,
          fileName: existingFile.name,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
}
