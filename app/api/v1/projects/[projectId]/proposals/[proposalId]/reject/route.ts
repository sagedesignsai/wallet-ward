import { z } from "zod"
import { handleRouteError, json } from "@/lib/api/http"
import { requireAuth, requireOrganization, requirePermission } from "@/lib/api/auth"
import { rejectProposal } from "@/lib/services/proposals"

const rejectSchema = z.object({
  notes: z.string().optional(),
})

type Ctx = { params: Promise<{ projectId: string; proposalId: string }> }

/**
 * POST /api/v1/projects/[projectId]/proposals/[proposalId]/reject
 * Reject a proposal
 */
export async function POST(request: Request, ctx: Ctx) {
  try {
    const { proposalId } = await ctx.params
    const auth = await requireAuth()
    const org = await requireOrganization(auth)
    requirePermission(org.memberRole, "project:write")

    const body = await request.json()
    const { notes } = rejectSchema.parse(body)

    const rejected = await rejectProposal({
      ctx: auth,
      proposalId,
      notes,
    })

    return json({ data: rejected })
  } catch (error) {
    return handleRouteError(error)
  }
}
