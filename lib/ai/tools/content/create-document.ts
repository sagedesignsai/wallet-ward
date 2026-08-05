import { tool } from "ai";
import { z } from "zod";

/**
 * Create Document Tool
 * 
 * Creates a new document in a project with Markdown support.
 */
export const createDocumentTool = tool({
  description: "Create a new document in a project with a title and content (supports Markdown).",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    title: z.string().describe("Document title"),
    content: z.string().describe("Document content (Markdown supported)"),
  }),
  contextSchema: z.object({
    userId: z.string(),
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId, title, content }, { context }) => {
    const resolvedProjectId = projectId ?? context.projectId;
    try {
      const { prisma } = await import("@/lib/db");

      if (!resolvedProjectId) {
        throw new Error("Project not found or access denied");
      }

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

      const document = await prisma.document.create({
        data: {
          projectId: resolvedProjectId,
          title,
          content,
          createdById: context.userId,
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        document: {
          id: document.id,
          title: document.title,
          createdAt: document.createdAt.toISOString(),
        },
      };
    } catch (error) {
      console.error("[create-document error]", error);
      throw new Error("Failed to create document. Please try again.");
    }
  },
});
