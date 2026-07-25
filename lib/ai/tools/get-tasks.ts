import { tool } from "ai";
import { z } from "zod";

/**
 * Get Tasks Tool
 * 
 * Retrieves tasks from a project with optional status filtering.
 */
export const getTasksTool = tool({
  description: "Retrieve tasks from a project. Can filter by status.",
  inputSchema: z.object({
    projectId: z.string().describe("The project ID"),
    status: z.enum(["todo", "in_progress", "done"]).optional().describe("Optional: filter by status"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async ({ projectId, status }, { context }) => {
    try {
      const { prisma } = await import("@/lib/db");

      const tasks = await prisma.task.findMany({
        where: {
          projectId,
          status,
          project: {
            organizationId: context.organizationId,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          assignee: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 50,
      });

      return {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || null,
          status: t.status,
          assignee: t.assignee?.name || t.assignee?.email || null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      };
    } catch (error) {
      console.error("[get-tasks error]", error);
      throw new Error("Failed to retrieve tasks. Please try again.");
    }
  },
});
