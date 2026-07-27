import { NextRequest, NextResponse } from "next/server"
import { RepositoryService } from "@/lib/services/repository-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * DELETE /api/v1/projects/:projectId/repositories/:repositoryId/webhooks/:webhookId
 * Delete a webhook
 */
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      projectId: string
      repositoryId: string
      webhookId: string
    }>
  }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, repositoryId, webhookId } = await params

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
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      )
    }

    // Verify webhook exists and belongs to repository
    const webhook = await db.repositoryWebhook.findUnique({
      where: { id: webhookId },
    })

    if (!webhook || webhook.repositoryId !== repositoryId) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    await db.repositoryWebhook.delete({
      where: { id: webhookId },
    })

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "repository_webhook",
        resourceId: webhookId,
        metadata: {
          action: "delete",
          projectId,
          repositoryId,
          repositoryName: repository.name,
          event: webhook.event,
          url: webhook.url,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting webhook:", error)
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    )
  }
}
