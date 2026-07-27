import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { FileType, FileVisibility } from "@prisma/client"

/**
 * POST /api/v1/projects/:projectId/files/upload
 * Upload a file via multipart form data
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

    // Handle multipart form data
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const tags = formData.get("tags") as string
    const visibility = formData.get("visibility") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate a storage ID (in production, store binary in Appwrite/S3)
    const storageId = crypto.randomUUID()

    const fileRecord = await FileService.create({
      projectId,
      name: name || file.name,
      path: `/${file.name}`,
      type: (type as FileType) || "other",
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      storageId,
      tags: tags ? tags.split(",") : [],
      visibility: (visibility as FileVisibility) || "private",
      createdById: session.user.id,
    })

    // Audit log the upload
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "file",
        resourceId: fileRecord.id,
        metadata: {
          action: "upload",
          projectId,
          fileName: fileRecord.name,
          fileType: fileRecord.type,
          size: fileRecord.size,
        },
      },
    })

    return NextResponse.json({ data: fileRecord }, { status: 201 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
