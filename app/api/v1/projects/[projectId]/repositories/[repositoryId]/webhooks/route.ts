import { NextRequest, NextResponse } from "next/server"
import { RepositoryService } from "@/lib/services/repository-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import crypto from "crypto"

/**
 * Generate a random HMAC secret for webhook signature verification
 */
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`
}

/**
 * GET /api/v1/projects/:projectId/repositories/:repositoryId/webhooks
 * List webhooks for a repository
 */
export async function GET(
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
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      )
    }

    const webhooks = await db.repositoryWebhook.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: webhooks })
  } catch (error) {
    console.error("Error fetching webhooks:", error)
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/projects/:projectId/repositories/:repositoryId/webhooks
 * Create a new webhook for a repository
 *
 * Body:
 *   event   — WebhookEvent enum value (push, pull_request, release, tag, issue, commit_comment)
 *   url     — The URL to receive webhook payloads
 *   enabled — Optional, defaults to true
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
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate required fields
    if (!body.event || !body.url) {
      return NextResponse.json(
        { error: "Missing required fields: event, url" },
        { status: 400 }
      )
    }

    // Validate event is a valid WebhookEvent enum value
    const validEvents = [
      "push",
      "pull_request",
      "release",
      "tag",
      "issue",
      "commit_comment",
    ]
    if (!validEvents.includes(body.event)) {
      return NextResponse.json(
        { error: `Invalid event. Must be one of: ${validEvents.join(", ")}` },
        { status: 400 }
      )
    }

    // Generate a unique HMAC secret for signature verification
    const secret = generateWebhookSecret()

    const webhook = await db.repositoryWebhook.create({
      data: {
        repositoryId,
        event: body.event,
        url: body.url,
        secret,
        enabled: body.enabled !== undefined ? body.enabled : true,
      },
    })

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "repository_webhook",
        resourceId: webhook.id,
        metadata: {
          action: "create",
          projectId,
          repositoryId,
          repositoryName: repository.name,
          event: webhook.event,
          url: webhook.url,
        },
      },
    })

    return NextResponse.json({ data: webhook }, { status: 201 })
  } catch (error) {
    console.error("Error creating webhook:", error)
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    )
  }
}
