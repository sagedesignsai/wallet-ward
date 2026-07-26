import { tool } from "ai"
import { z } from "zod"

/**
 * Get Pending Proposals Tool
 *
 * Allows an agent to check if its proposed actions have been approved
 * by a human. This enables agents to continue execution after approval.
 *
 * Usage:
 * - Agent proposes action → server creates ActionProposal (awaiting_approval)
 * - Agent calls getPendingProposalsTool()
 * - If approved proposals exist, agent can continue workflow
 * - Agent can skip/skip if rejected
 */
export const getPendingProposalsTool = tool({
  description:
    "Check pending action proposals for this agent session. Returns awaiting, approved, rejected, executed, and failed proposals.",
  inputSchema: z.object({
    sessionId: z.string().describe("The agent session ID"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ sessionId }, { context }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      const res = await fetch(
        `${baseUrl}/api/agents/sessions/${sessionId}/pending-proposals`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!res.ok) {
        return {
          error: true,
          message: `Failed to fetch pending proposals: ${res.statusText}`,
        }
      }

      const data = await res.json()

      return {
        session: data.session,
        pendingProposals: data.pendingProposals,
        summary: {
          awaitingCount: data.pendingProposals.awaiting.length,
          approvedCount: data.pendingProposals.approved.length,
          rejectedCount: data.pendingProposals.rejected.length,
          executedCount: data.pendingProposals.executed.length,
          failedCount: data.pendingProposals.failed.length,
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
