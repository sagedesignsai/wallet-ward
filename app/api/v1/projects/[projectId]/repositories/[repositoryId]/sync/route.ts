import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { notFound } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { syncRepositoryWithGithub } from "@/lib/services/repository-service"

type Ctx = {
  params: Promise<{ projectId: string; repositoryId: string }>
}

/**
 * POST /api/v1/projects/:projectId/repositories/:repositoryId/sync
 * Trigger a live repository sync against GitHub
 */
export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { projectId, repositoryId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    // Explicitly verify the repository exists in this project AND this
    // organization before syncing (defense-in-depth on top of the org
    // scoping inside syncRepositoryWithGithub).
    const repository = await db.repository.findFirst({
      where: {
        id: repositoryId,
        projectId,
        project: { organizationId: orgCtx.organizationId },
      },
    })
    if (!repository) throw notFound("Repository not found")

    const result = await syncRepositoryWithGithub(
      repositoryId,
      orgCtx.organizationId!
    )

    return json({ data: { synced: result.synced, message: result.message } })
  } catch (error) {
    return handleRouteError(error)
  }
}
