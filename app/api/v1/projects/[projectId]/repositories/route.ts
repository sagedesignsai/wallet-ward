import { NextRequest, NextResponse } from "next/server"
import { RepositoryService } from "@/lib/services/repository-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { RepositoryProvider, RepositoryAccessType } from "@prisma/client"

/**
 * GET /api/v1/projects/:projectId/repositories
 * List all repositories for a project
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

    const repositories =
      await RepositoryService.listByProjectWithMetadata(projectId)

    return NextResponse.json({ data: repositories })
  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/projects/:projectId/repositories
 * Create a new repository
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
    if (!body.name || !body.url || !body.provider) {
      return NextResponse.json(
        { error: "Missing required fields: name, url, provider" },
        { status: 400 }
      )
    }

    // Check if repository already exists
    const exists = await RepositoryService.existsInProject(projectId, body.url)
    if (exists) {
      return NextResponse.json(
        { error: "Repository with this URL already exists in project" },
        { status: 409 }
      )
    }

    const repository = await RepositoryService.create({
      projectId,
      name: body.name,
      description: body.description,
      provider: body.provider as RepositoryProvider,
      url: body.url,
      branch: body.branch || "main",
      accessType: (body.accessType as RepositoryAccessType) || "private",
      credentialId: body.credentialId,
      createdById: session.user.id,
    })

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "repository",
        resourceId: repository.id,
        metadata: {
          action: "create",
          projectId,
          repositoryName: repository.name,
          provider: repository.provider,
        },
      },
    })

    return NextResponse.json({ data: repository }, { status: 201 })
  } catch (error) {
    console.error("Error creating repository:", error)
    return NextResponse.json(
      { error: "Failed to create repository" },
      { status: 500 }
    )
  }
}
