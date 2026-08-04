import { tool } from "ai"
import { z } from "zod"

/**
 * Get Pending Proposals Tool
 *
 * Allows an agent to poll whether its proposed actions have been approved.
 * Available to all agent types.
 */
export const getPendingProposalsTool = tool({
  description:
    "Check pending action proposals for this agent session. Returns awaiting, approved, rejected, executed, and failed proposals so the agent can continue after human approval.",
  inputSchema: z.object({
    sessionId: z.string().describe("The agent session ID"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ sessionId }, { context }) => {
    try {
      const { prisma } = await import("@/lib/db")

      const session = await prisma.agentSession.findFirst({
        where: {
          id: sessionId,
          project: { organizationId: context.organizationId },
        },
        select: {
          id: true,
          projectId: true,
          name: true,
          type: true,
          status: true,
          createdAt: true,
        },
      })

      if (!session) {
        return { error: true, message: "Agent session not found" }
      }

      const proposals = await prisma.actionProposal.findMany({
        where: { agentSessionId: sessionId },
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
          approvalNotes: true,
          rejectionNotes: true,
        },
      })

      const group = (status: string) =>
        proposals.filter((p) => p.status === status)

      return {
        session: {
          id: session.id,
          projectId: session.projectId,
          name: session.name,
          type: session.type,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
        },
        pendingProposals: {
          awaiting: group("awaiting_approval").map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            riskLevel: p.riskLevel,
            actionType: p.actionType,
            targetSystem: p.targetSystem,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
          })),
          approved: group("approved").map((p) => ({
            id: p.id,
            title: p.title,
            actionType: p.actionType,
            targetSystem: p.targetSystem,
            payload: p.payload,
            status: p.status,
            approvalNotes: p.approvalNotes,
            createdAt: p.createdAt.toISOString(),
          })),
          rejected: group("rejected").map((p) => ({
            id: p.id,
            title: p.title,
            actionType: p.actionType,
            status: p.status,
            rejectionNotes: p.rejectionNotes,
            createdAt: p.createdAt.toISOString(),
          })),
          executed: group("executed").map((p) => ({
            id: p.id,
            title: p.title,
            actionType: p.actionType,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
          })),
          failed: group("failed").map((p) => ({
            id: p.id,
            title: p.title,
            actionType: p.actionType,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
          })),
        },
        summary: {
          awaitingCount: group("awaiting_approval").length,
          approvedCount: group("approved").length,
          rejectedCount: group("rejected").length,
          executedCount: group("executed").length,
          failedCount: group("failed").length,
        },
      }
    } catch (error) {
      console.error("[get-pending-proposals error]", error)
      return {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch pending proposals",
      }
    }
  },
})
