import { tool } from "ai"
import { z } from "zod"
import { getDecryptedToken } from "@/lib/services/integrations"
import { prisma } from "@/lib/db"

export const trelloCreateCardTool = tool({
  description: `Create a new card in Trello. Requires a connected Trello integration.
  
  Use this tool to:
  - Create new cards in Trello lists
  - Set card details like name, description, due date
  - Add labels and members to cards
  
  The tool will automatically use the connected Trello integration for the current project.`,
  
  inputSchema: z.object({
    projectId: z.string().describe("The project ID that has the Trello integration"),
    listId: z.string().describe("Trello list ID where the card will be created"),
    name: z.string().min(1).describe("Name/title of the card"),
    description: z.string().optional().describe("Description of the card (supports Markdown)"),
    position: z.enum(["top", "bottom"]).default("bottom").describe("Position in the list"),
    dueDate: z.string().optional().describe("Due date in ISO 8601 format (e.g., '2024-12-31T23:59:59Z')"),
    labelIds: z.array(z.string()).optional().describe("Array of label IDs to add to the card"),
    memberIds: z.array(z.string()).optional().describe("Array of member IDs to assign to the card"),
  }),
  
  execute: async (input) => {
    try {
      // Find the Trello integration for this project
      const integration = await prisma.integration.findFirst({
        where: {
          projectId: input.projectId,
          provider: "trello",
          enabled: true,
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
          error: "No active Trello integration found for this project",
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
          error: "Failed to retrieve Trello access token",
        }
      }

      // Get API key from metadata
      const apiKey = (integration.metadata as { apiKey?: string })?.apiKey
      if (!apiKey) {
        return {
          success: false,
          error: "Trello API key not found in integration metadata",
        }
      }

      // Build query parameters
      const params = new URLSearchParams({
        key: apiKey,
        token: token,
        idList: input.listId,
        name: input.name,
        pos: input.position,
      })

      if (input.description) {
        params.set("desc", input.description)
      }

      if (input.dueDate) {
        params.set("due", input.dueDate)
      }

      if (input.labelIds && input.labelIds.length > 0) {
        params.set("idLabels", input.labelIds.join(","))
      }

      if (input.memberIds && input.memberIds.length > 0) {
        params.set("idMembers", input.memberIds.join(","))
      }

      // Create the card
      const response = await fetch(
        `https://api.trello.com/1/cards?${params.toString()}`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create Trello card: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        cardId: result.id,
        cardUrl: result.url,
        cardShortUrl: result.shortUrl,
        message: `Successfully created Trello card: ${input.name}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  },
})
