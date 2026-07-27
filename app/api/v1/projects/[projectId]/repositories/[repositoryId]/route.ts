import { NextRequest, NextResponse } from "next/server"
import { RepositoryService } from "@/lib/services/repository-service"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { RepositoryAccessType } from "@prisma/client"

/**
 * GET /api/v1/projects/:projectId/repositories/:repositoryId
 * Get a specific repository
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

    const repository = await RepositoryService.getByIdWithMetadata(repositoryId)

    if (!repository || repository.projectId !== projectId) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    return NextResponse.json({ data: repository })
  } catch (error) {
    console.error("Error fetching repository:", error)
    return NextResponse.json(
      { error: "Failed to fetch repository" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/projects/:projectId/repositories/:repositoryId
 * Update a repository
 */
export async function PATCH(
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
    const existingRepo = await RepositoryService.getById(repositoryId)
    if (!existingRepo || existingRepo.projectId !== projectId) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    const body = await req.json()

    const repository = await RepositoryService.update(repositoryId, {
      name: body.name,
      description: body.description,
      branch: body.branch,
      accessType: body.accessType as RepositoryAccessType,
      credentialId: body.credentialId,
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
          action: "update",
          projectId,
          repositoryName: repository.name,
          changes: body,
        },
      },
    })

    return NextResponse.json({ data: repository })
  } catch (error) {
    console.error("Error updating repository:", error)
    return NextResponse.json(
      { error: "Failed to update repository" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/projects/:projectId/repositories/:repositoryId
 * Delete a repository
 */
export async function DELETE(
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
    const existingRepo = await RepositoryService.getById(repositoryId)
    if (!existingRepo || existingRepo.projectId !== projectId) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    await RepositoryService.delete(repositoryId)

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: project.organizationId,
        actorUserId: session.user.id,
        action: "project_update",
        resourceType: "repository",
        resourceId: repositoryId,
        metadata: {
          action: "delete",
          projectId,
          repositoryName: existingRepo.name,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting repository:", error)
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 }
    )
  }
}
