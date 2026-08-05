import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest, notFound } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/services/audit"
import { RepositoryService } from "@/lib/services/repository-service"
import type { RepositoryAccessType } from "@prisma/client"

type Ctx = { params: Promise<{ projectId: string; repositoryId: string }> }

/**
 * GET /api/v1/projects/:projectId/repositories/:repositoryId
 * Get a specific repository
 */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId, repositoryId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: orgCtx.organizationId },
    })
    if (!project) throw notFound("Project not found")

    const repository = await RepositoryService.getByIdWithMetadata(repositoryId)

    if (!repository || repository.projectId !== projectId) {
      throw notFound("Repository not found")
    }

    return json({ data: repository })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * PATCH /api/v1/projects/:projectId/repositories/:repositoryId
 * Update a repository
 */
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, repositoryId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: orgCtx.organizationId },
    })
    if (!project) throw notFound("Project not found")

    // Verify repository exists and belongs to project
    const existingRepo = await RepositoryService.getById(repositoryId)
    if (!existingRepo || existingRepo.projectId !== projectId) {
      throw notFound("Repository not found")
    }

    const body = await request.json()

    // Validate repository name when provided (defense-in-depth against
    // clone-tool injection)
    if (
      body.name !== undefined &&
      !/^[A-Za-z0-9._-]{1,100}$/.test(body.name)
    ) {
      throw badRequest(
        "Invalid repository name: only letters, numbers, dots, underscores, and hyphens are allowed (max 100 characters)"
      )
    }

    const repository = await RepositoryService.update(repositoryId, {
      name: body.name,
      description: body.description,
      branch: body.branch,
      accessType: body.accessType as RepositoryAccessType,
      credentialId: body.credentialId,
    })

    // Log audit event
    await writeAuditLog({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      action: "project_update",
      resourceType: "repository",
      resourceId: repository.id,
      metadata: {
        action: "update",
        projectId,
        repositoryName: repository.name,
        changes: body,
      },
    })

    return json({ data: repository })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * DELETE /api/v1/projects/:projectId/repositories/:repositoryId
 * Delete a repository
 */
export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, repositoryId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: orgCtx.organizationId },
    })
    if (!project) throw notFound("Project not found")

    // Verify repository exists and belongs to project
    const existingRepo = await RepositoryService.getById(repositoryId)
    if (!existingRepo || existingRepo.projectId !== projectId) {
      throw notFound("Repository not found")
    }

    await RepositoryService.delete(repositoryId)

    // Log audit event
    await writeAuditLog({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      action: "project_update",
      resourceType: "repository",
      resourceId: repositoryId,
      metadata: {
        action: "delete",
        projectId,
        repositoryName: existingRepo.name,
      },
    })

    return json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
