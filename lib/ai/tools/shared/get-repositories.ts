import { tool } from "ai"
import { z } from "zod"

/**
 * Get Repositories Tool
 *
 * Retrieves Git repositories connected to a project.
 * Available to all agent types.
 */
export const getRepositoriesTool = tool({
  description:
    "Retrieve Git repositories connected to a project. Returns repository names, providers, sync status, and URLs.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId }, { context }) => {
    try {
      const resolvedProjectId = projectId ?? context.projectId
      const { prisma } = await import("@/lib/db")

      const repositories = await prisma.repository.findMany({
        where: {
          projectId: resolvedProjectId,
          project: { organizationId: context.organizationId },
        },
        select: {
          id: true,
          name: true,
          description: true,
          provider: true,
          url: true,
          branch: true,
          accessType: true,
          syncStatus: true,
          lastSyncAt: true,
          createdAt: true,
          _count: { select: { webhooks: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      return {
        count: repositories.length,
        repositories: repositories.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? null,
          provider: r.provider,
          url: r.url,
          branch: r.branch,
          accessType: r.accessType,
          syncStatus: r.syncStatus,
          lastSyncAt: r.lastSyncAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          webhookCount: r._count.webhooks,
        })),
      }
    } catch (error) {
      console.error("[get-repositories error]", error)
      throw new Error("Failed to retrieve repositories. Please try again.")
    }
  },
})
