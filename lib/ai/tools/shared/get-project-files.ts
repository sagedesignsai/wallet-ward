import { tool } from "ai"
import { z } from "zod"

/**
 * Get Project Files Tool
 *
 * Retrieves files and artifacts from a project.
 * Available to all agent types.
 */
export const getProjectFilesTool = tool({
  description:
    "Retrieve files and artifacts from a project. Returns file names, types, sizes, versions, and metadata.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    type: z
      .enum(["artifact", "document", "config", "asset", "code", "data", "other"])
      .optional()
      .describe("Optional: filter by file type"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId, type }, { context }) => {
    try {
      const resolvedProjectId = projectId ?? context.projectId
      const { prisma } = await import("@/lib/db")

      const files = await prisma.projectFile.findMany({
        where: {
          projectId: resolvedProjectId,
          project: { organizationId: context.organizationId },
          ...(type && { type }),
        },
        select: {
          id: true,
          name: true,
          path: true,
          type: true,
          mimeType: true,
          size: true,
          version: true,
          tags: true,
          visibility: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { versions: true, shares: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      return {
        count: files.length,
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          path: f.path,
          type: f.type,
          mimeType: f.mimeType,
          size: f.size,
          version: f.version,
          tags: f.tags,
          visibility: f.visibility,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
          versionCount: f._count.versions,
          shareCount: f._count.shares,
        })),
      }
    } catch (error) {
      console.error("[get-project-files error]", error)
      throw new Error("Failed to retrieve project files. Please try again.")
    }
  },
})
