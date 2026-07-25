import { tool } from "ai";
import { z } from "zod";

/**
 * Get Projects Tool
 * 
 * Lists all projects in the current organization with their environments.
 */
export const getProjectsTool = tool({
  description: "List all projects in the current organization with their environments.",
  inputSchema: z.object({}),
  contextSchema: z.object({
    organizationId: z.string(),
  }),
  execute: async (_input, { context }) => {
    try {
      const { prisma } = await import("@/lib/db");

      const projects = await prisma.project.findMany({
        where: {
          organizationId: context.organizationId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          environments: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      });

      return {
        count: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description || null,
          createdAt: p.createdAt.toISOString(),
          environments: p.environments,
        })),
      };
    } catch (error) {
      console.error("[get-projects error]", error);
      throw new Error("Failed to retrieve projects. Please try again.");
    }
  },
});
