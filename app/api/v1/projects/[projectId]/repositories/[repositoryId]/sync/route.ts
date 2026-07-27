import { NextRequest, NextResponse } from "next/server"
import { RepositoryService } from "@/lib/services/repository-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * POST /api/v1/projects/:projectId/repositories/:repositoryId/sync
 * Trigger a repository sync
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; repositoryId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, repositoryId } = await params

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

    // Verify repository exists and belongs to project
    const repository = await RepositoryService.getById(repositoryId)
    if (!repository || repository.projectId !== projectId) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    // Update sync status to syncing
    await RepositoryService.updateSyncStatus(repositoryId, "syncing")

    // Find GitHub integration for the project
    const integration = await db.integration.findFirst({
      where: {
        projectId,
        provider: "github",
        enabled: true,
      },
    })

    // In a real implementation, this would clone/fetch the repo via GitHub API
    // For now, simulate a successful sync
    if (integration) {
      // TODO: Call GitHub API to fetch latest changes using the integration token
      // This would typically involve:
      // 1. Decrypting the access token
      // 2. Calling GitHub API to fetch refs/commits
      // 3. Updating local repository metadata
    }

    // Update sync status to synced
    await RepositoryService.updateSyncStatus(repositoryId, "synced")

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "repository",
        resourceId: repositoryId,
        metadata: {
          action: "sync",
          projectId,
          repositoryName: repository.name,
        },
      },
    })

    // Fetch the updated repository to return the latest state
    const updatedRepository = await RepositoryService.getById(repositoryId)

    return NextResponse.json({ data: updatedRepository })
  } catch (error) {
    console.error("Error syncing repository:", error)

    // Try to set sync status to error if we have enough context
    try {
      const { projectId, repositoryId } = await params
      const repository = await RepositoryService.getById(repositoryId)
      if (repository && repository.projectId === projectId) {
        await RepositoryService.updateSyncStatus(repositoryId, "error")
      }
    } catch {
      // Best effort error status update
    }

    return NextResponse.json(
      { error: "Failed to sync repository" },
      { status: 500 }
    )
  }
}
