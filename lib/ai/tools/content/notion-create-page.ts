import { tool } from "ai"
import { z } from "zod"

export const notionCreatePageTool = tool({
  description: `Create a new page in Notion. Requires a connected Notion integration.
  
  Use this tool to:
  - Create new pages in Notion databases or as child pages
  - Set page properties (title, rich text, dates, etc.)
  - Add content blocks to pages
  
  The tool will automatically use the connected Notion integration for the current project.`,
  
  inputSchema: z.object({
    projectId: z.string().describe("The project ID that has the Notion integration"),
    parentId: z.string().describe("Parent page or database ID where the page will be created"),
    title: z.string().min(1).describe("Title of the page"),
    content: z.string().optional().describe("Content to add to the page (plain text, will be converted to blocks)"),
    properties: z.record(z.string(), z.unknown()).optional().describe("Additional properties for database pages (JSON object)"),
  }),

  contextSchema: z.object({
    organizationId: z.string(),
  }),
  
  execute: async (input, { context }) => {
    try {
      const { prisma } = await import("@/lib/db")
      const { getDecryptedToken } = await import("@/lib/services/integrations")

      // Find the Notion integration for this project
      const integration = await prisma.integration.findFirst({
        where: {
          projectId: input.projectId,
          provider: "notion",
          enabled: true,
          project: { organizationId: context.organizationId },
        },
        include: {
          project: {
            select: {
              organizationId: true,
            },
          },
        },
      })

      if (!integration) {
        return {
          success: false,
          error: "No active Notion integration found for this project",
        }
      }

      // Get the decrypted access token
      const token = await getDecryptedToken(
        integration,
        "access"
      )

      if (!token) {
        return {
          success: false,
          error: "Failed to retrieve Notion access token",
        }
      }

      // Build page payload
      const pagePayload: Record<string, unknown> = {
        parent: {
          page_id: input.parentId,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: input.title,
                },
              },
            ],
          },
          ...(input.properties || {}),
        },
      }

      // Add content blocks if provided
      if (input.content) {
        pagePayload.children = [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: input.content,
                  },
                },
              ],
            },
          },
        ]
      }

      // Create the page
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(pagePayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create Notion page: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        pageId: result.id,
        pageUrl: result.url,
        message: `Successfully created Notion page: ${input.title}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  },
})
