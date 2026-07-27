import { handleRouteError, json } from "@/lib/api/http"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { getProposal } from "@/lib/services/proposals"

type Ctx = { params: Promise<{ projectId: string; proposalId: string }> }

/**
 * GET /api/v1/projects/[projectId]/proposals/[proposalId]
 * Get a single proposal
 */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { proposalId } = await ctx.params
    const auth = await requireAuth()
    const org = await requireOrganization(auth)
    requirePermission(org.memberRole, "project:read")

    const proposal = await getProposal(proposalId, org.organizationId)

    return json({ data: proposal })
  } catch (error) {
    return handleRouteError(error)
  }
}
