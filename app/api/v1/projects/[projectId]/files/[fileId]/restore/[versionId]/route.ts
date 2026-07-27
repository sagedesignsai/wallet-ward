import { NextRequest, NextResponse } from "next/server"
import { FileService } from "@/lib/services/file-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * POST /api/v1/projects/:projectId/files/:fileId/restore/:versionId
 * Restore a file to a specific version
 */
export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; fileId: string; versionId: string }>
  }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, fileId, versionId } = await params

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

    // Verify version exists and belongs to the same project
    const version = await FileService.getById(versionId)
    if (!version || version.projectId !== projectId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    const restored = await FileService.restoreVersion(
      fileId,
      versionId,
      session.user.id
    )

    // Audit log the restore
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "file",
        resourceId: fileId,
        metadata: {
          action: "restore_version",
          projectId,
          fileName: file.name,
          restoredFromVersionId: versionId,
          newVersion: restored.version,
        },
      },
    })

    return NextResponse.json({ data: restored })
  } catch (error) {
    console.error("Error restoring file version:", error)
    return NextResponse.json(
      { error: "Failed to restore file version" },
      { status: 500 }
    )
  }
}
