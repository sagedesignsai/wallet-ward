import { tool } from "ai";
import { z } from "zod";

/**
 * Create Task Tool
 * 
 * Creates a new task in a project.
 */
export const createTaskTool = tool({
  description: "Create a new task in a project with a title, description, and status.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    title: z.string().describe("Task title"),
    description: z.string().optional().describe("Task description (optional)"),
    status: z.enum(["todo", "in_progress", "done"]).default("todo").describe("Task status"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId, title, description, status }, { context }) => {
    const resolvedProjectId = projectId ?? context.projectId;
    try {
      if (!resolvedProjectId) {
        throw new Error("Project not found or access denied");
      }

      const { prisma } = await import("@/lib/db");

      // Verify project belongs to org
      const project = await prisma.project.findFirst({
        where: {
          id: resolvedProjectId,
          organizationId: context.organizationId,
        },
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const task = await prisma.task.create({
        data: {
          projectId: resolvedProjectId,
          title,
          description,
          status,
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          createdAt: task.createdAt.toISOString(),
        },
      };
    } catch (error) {
      console.error("[create-task error]", error);
      throw new Error("Failed to create task. Please try again.");
    }
  },
});
