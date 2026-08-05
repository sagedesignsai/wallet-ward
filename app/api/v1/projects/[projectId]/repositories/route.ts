import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest, conflict, notFound } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { writeAuditLog } from "@/lib/services/audit"
import { RepositoryService } from "@/lib/services/repository-service"
import type { RepositoryProvider, RepositoryAccessType } from "@prisma/client"

type Ctx = { params: Promise<{ projectId: string }> }

/**
 * GET /api/v1/projects/:projectId/repositories
 * List all repositories for a project
 */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: orgCtx.organizationId },
    })
    if (!project) throw notFound("Project not found")

    const data = await RepositoryService.listByProjectWithMetadata(projectId)

    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST /api/v1/projects/:projectId/repositories
 * Create a new repository
 */
export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: orgCtx.organizationId },
    })
    if (!project) throw notFound("Project not found")

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.url || !body.provider) {
      throw badRequest("Missing required fields: name, url, provider")
    }

    // Validate repository name (defense-in-depth against clone-tool injection)
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(body.name)) {
      throw badRequest(
        "Invalid repository name: only letters, numbers, dots, underscores, and hyphens are allowed (max 100 characters)"
      )
    }

    // Check if repository already exists
    const exists = await RepositoryService.existsInProject(projectId, body.url)
    if (exists) {
      throw conflict("Repository with this URL already exists in project")
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
      createdById: authCtx.userId,
    })

    // Log audit event
    await writeAuditLog({
      ctx: orgCtx,
      organizationId: orgCtx.organizationId,
      action: "project_update",
      resourceType: "repository",
      resourceId: repository.id,
      metadata: {
        action: "create",
        projectId,
        repositoryName: repository.name,
        provider: repository.provider,
      },
    })

    return json({ data: repository }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
