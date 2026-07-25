import { z } from "zod"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest } from "@/lib/api/errors"
import {
  getIntegration,
  getDecryptedToken,
  fetchGitHubRepos,
  fetchGitHubPullRequests,
  fetchGitHubCommits,
} from "@/lib/services/integrations"

const githubQuerySchema = z.object({
  type: z.enum(["repos", "pulls", "commits"]),
  owner: z.string().optional(),
  repo: z.string().optional(),
})

type Ctx = { params: Promise<{ projectId: string; integrationId: string }> }

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { integrationId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const integration = await getIntegration(integrationId, orgCtx.organizationId)

    if (integration.provider !== "github") {
      throw badRequest("Integration is not a GitHub integration")
    }

    const { searchParams } = new URL(request.url)
    const query = githubQuerySchema.parse({
      type: searchParams.get("type") ?? "repos",
      owner: searchParams.get("owner"),
      repo: searchParams.get("repo"),
    })

    const accessToken = await getDecryptedToken(
      { ...integration, project: { organizationId: orgCtx.organizationId } },
      "access"
    )

    let data: unknown

    switch (query.type) {
      case "repos":
        data = await fetchGitHubRepos(accessToken)
        break
      case "pulls":
        if (!query.owner || !query.repo) {
          throw badRequest("`owner` and `repo` query params are required for pulls")
        }
        data = await fetchGitHubPullRequests(accessToken, query.owner, query.repo)
        break
      case "commits":
        if (!query.owner || !query.repo) {
          throw badRequest("`owner` and `repo` query params are required for commits")
        }
        data = await fetchGitHubCommits(accessToken, query.owner, query.repo)
        break
    }

    return json({ data })
  } catch (error) {
    return handleRouteError(error)
  }
}
