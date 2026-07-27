import { handleRouteError, json } from "@/lib/api/http"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { listProposals } from "@/lib/services/proposals"
import type { ProposalStatus } from "@/generated/prisma/client"

type Ctx = { params: Promise<{ projectId: string }> }

/**
 * GET /api/v1/projects/[projectId]/proposals
 * List all proposals for a project
 */
export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params
    const auth = await requireAuth()
    const org = await requireOrganization(auth)
    requirePermission(org.memberRole, "project:read")

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as ProposalStatus | null
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)

    const proposals = await listProposals(projectId, org.organizationId, {
      status: status ?? undefined,
      limit,
    })

    return json({ data: proposals })
  } catch (error) {
    return handleRouteError(error)
  }
}
