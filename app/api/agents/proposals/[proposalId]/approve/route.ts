import { requireAuth, requireOrganization } from "@/lib/api/auth"
import { json, handleRouteError } from "@/lib/api/http"
import { approveProposal } from "@/lib/services/proposals"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  try {
    const rawAuth = await requireAuth()
    const auth = await requireOrganization(rawAuth)
    const { proposalId } = await params

    const body = await req.json().catch(() => ({}))
    const proposal = await approveProposal({
      ctx: auth,
      proposalId,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    })

    return json({
      success: true,
      proposalId,
      status: proposal.status,
      message: `Proposal "${proposal.title}" has been approved for execution.`,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
