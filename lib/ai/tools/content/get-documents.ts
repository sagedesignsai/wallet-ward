import { tool } from "ai";
import { z } from "zod";

/**
 * Get Documents Tool
 * 
 * Retrieves documents from a project with optional search filtering.
 */
export const getDocumentsTool = tool({
  description: "Retrieve documents from a project. Returns document titles and content.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    searchQuery: z.string().optional().describe("Optional: search within document titles/content"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId, searchQuery }, { context }) => {
    const resolvedProjectId = projectId ?? context.projectId;
    try {
      const { prisma } = await import("@/lib/db");

      const documents = await prisma.document.findMany({
        where: {
          projectId: resolvedProjectId,
          project: {
            organizationId: context.organizationId,
          },
          ...(searchQuery && {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { content: { contains: searchQuery, mode: "insensitive" } },
            ],
          }),
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });

      return {
        count: documents.length,
        documents: documents.map((d) => ({
          id: d.id,
          title: d.title,
          content: d.content?.substring(0, 500) + (d.content && d.content.length > 500 ? "..." : "") || null,
          fullContent: d.content,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
          author: d.createdBy?.name || d.createdBy?.email || "Unknown",
        })),
      };
    } catch (error) {
      console.error("[get-documents error]", error);
      throw new Error("Failed to retrieve documents. Please try again.");
    }
  },
});
