import { z } from "zod"
import { handleRouteError, json } from "@/lib/api/http"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import {
  approveProposal,
  markProposalExecuted,
  markProposalFailed,
  executeProposal,
} from "@/lib/services/proposals"

const approveSchema = z.object({
  notes: z.string().optional(),
})

type Ctx = { params: Promise<{ projectId: string; proposalId: string }> }

/**
 * POST /api/v1/projects/[projectId]/proposals/[proposalId]/approve
 * Approve a proposal and execute the action
 */
export async function POST(request: Request, ctx: Ctx) {
  try {
    const { proposalId } = await ctx.params
    const auth = await requireAuth()
    const org = await requireOrganization(auth)
    requirePermission(org.memberRole, "project:write")

    const body = await request.json()
    const { notes } = approveSchema.parse(body)

    // 1. Approve the proposal
    await approveProposal({
      ctx: auth,
      proposalId,
      notes,
    })

    // 2. Execute the action
    try {
      const execution = await executeProposal({
        ctx: auth,
        proposalId,
      })

      // 3. Mark as executed
      const executed = await markProposalExecuted(
        proposalId,
        org.organizationId,
        auth
      )

      return json({
        data: executed,
        execution,
      })
    } catch (executionError) {
      // If execution fails, mark proposal as failed but don't crash
      try {
        await markProposalFailed(
          proposalId,
          org.organizationId,
          executionError instanceof Error
            ? executionError.message
            : "Unknown error"
        )
      } catch {
        // Silent catch - audit log is our fallback
      }

      return handleRouteError(executionError)
    }
  } catch (error) {
    return handleRouteError(error)
  }
}
