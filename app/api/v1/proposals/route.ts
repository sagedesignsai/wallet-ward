import { handleRouteError, json } from "@/lib/api/http"
import { requireAuth, requireOrganization, requirePermission } from "@/lib/api/auth"
import { prisma } from "@/lib/db"
import { toProposalDto } from "@/lib/services/proposals"

/**
 * GET /api/v1/proposals
 * List all proposals across all projects in the active organization.
 * Supports ?status=awaiting_approval&limit=20
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    const org = await requireOrganization(auth)
    requirePermission(org.memberRole, "project:read")

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as string | null
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)

    // Fetch all projects in this org to scope the query
    const proposals = await prisma.actionProposal.findMany({
      where: {
        project: { organizationId: org.organizationId },
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return json({ data: proposals.map(toProposalDto) })
  } catch (error) {
    return handleRouteError(error)
  }
}
