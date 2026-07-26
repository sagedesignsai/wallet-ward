import { handleRouteError, json } from "@/lib/api/http"
import { requireAuth } from "@/lib/api/auth"
import { prisma } from "@/lib/db"
import { notFound } from "@/lib/api/errors"

type Ctx = { params: Promise<{ sessionId: string }> }

/**
 * GET /api/agents/sessions/[sessionId]/pending-proposals
 *
 * Return pending approvals and approved proposals for an agent session.
 * Allows agents to poll for approval status and continue execution.
 */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const auth = await requireAuth()
    const { sessionId } = await ctx.params

    const session = await prisma.agentSession.findFirst({
      where: {
        id: sessionId,
        project: {
          organizationId: auth.organizationId ?? undefined,
        },
      },
      include: {
        project: {
          select: { organizationId: true },
        },
      },
    })

    if (!session || !auth.organizationId) {
      throw notFound("Agent session not found")
    }

    if (session.project.organizationId !== auth.organizationId) {
      throw notFound("Agent session not found")
    }

    const proposals = await prisma.actionProposal.findMany({
      where: {
        agentSessionId: sessionId,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        riskLevel: true,
        actionType: true,
        targetSystem: true,
        status: true,
        payload: true,
        createdAt: true,
        updatedAt: true,
        approvalNotes: true,
        rejectionNotes: true,
      },
    })

    const awaiting = proposals.filter((p) => p.status === "awaiting_approval")
    const approved = proposals.filter((p) => p.status === "approved")
    const rejected = proposals.filter((p) => p.status === "rejected")
    const executed = proposals.filter((p) => p.status === "executed")
    const failed = proposals.filter((p) => p.status === "failed")

    return json({
      session: {
        id: session.id,
        projectId: session.projectId,
        name: session.name,
        type: session.type,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
      },
      pendingProposals: {
        awaiting: awaiting.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          riskLevel: p.riskLevel,
          actionType: p.actionType,
          targetSystem: p.targetSystem,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
        approved: approved.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          actionType: p.actionType,
          targetSystem: p.targetSystem,
          payload: p.payload,
          status: p.status,
          approvalNotes: p.approvalNotes,
          createdAt: p.createdAt.toISOString(),
        })),
        rejected: rejected.map((p) => ({
          id: p.id,
          title: p.title,
          actionType: p.actionType,
          status: p.status,
          rejectionNotes: p.rejectionNotes,
          createdAt: p.createdAt.toISOString(),
        })),
        executed: executed.map((p) => ({
          id: p.id,
          title: p.title,
          actionType: p.actionType,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
        failed: failed.map((p) => ({
          id: p.id,
          title: p.title,
          actionType: p.actionType,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
