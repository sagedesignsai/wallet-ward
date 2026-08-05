import { tool } from "ai"
import { z } from "zod"

/**
 * Propose Action Tool (Human-in-the-Loop)
 *
 * Submits a high-risk action for user review and approval before executing.
 * Available to all agent types.
 */
export const proposeActionTool = tool({
  description:
    "Propose a high-risk action for human review and approval before executing (Human-in-the-Loop control). Always use this before deploying, deleting, publishing, or rotating secrets.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    title: z
      .string()
      .describe("Action title (e.g., 'Deploy Next.js app to Production')"),
    description: z
      .string()
      .describe("Detailed breakdown of what will happen upon approval"),
    riskLevel: z
      .enum(["low", "medium", "high", "critical"])
      .default("high")
      .describe("Risk level assessment"),
    targetSystem: z
      .string()
      .describe("Target system (e.g., 'GitHub main', 'Vercel Prod')"),
    actionType: z
      .enum(["deploy", "publish", "delete", "rotate_secret", "grant_access"])
      .describe("Type of action"),
    payload: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Action arguments to execute upon approval"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
    userId: z.string(),
    agentSessionId: z.string().optional(),
  }),
  execute: async (
    { projectId, title, description, riskLevel, targetSystem, actionType, payload },
    { context }
  ) => {
    try {
      const resolvedProjectId = projectId ?? context.projectId
      const { createProposal } = await import("@/lib/services/proposals")

      const proposal = await createProposal({
        ctx: {
          userId: context.userId,
          organizationId: context.organizationId,
        } as any,
        projectId: resolvedProjectId,
        agentSessionId: context.agentSessionId,
        title,
        description,
        riskLevel,
        actionType,
        targetSystem,
        payload: payload ?? {},
      })

      return {
        proposalId: proposal.id,
        status: proposal.status,
        title: proposal.title,
        riskLevel: proposal.riskLevel,
        targetSystem: proposal.targetSystem,
        message: `Action proposal "${title}" submitted for human review. Awaiting approval in the dashboard.`,
      }
    } catch (error) {
      console.error("[propose-action error]", error)
      throw new Error(
        error instanceof Error ? error.message : "Failed to create action proposal."
      )
    }
  },
})
