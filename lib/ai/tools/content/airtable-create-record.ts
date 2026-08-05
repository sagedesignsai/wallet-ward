import { tool } from "ai"
import { z } from "zod"

export const airtableCreateRecordTool = tool({
  description: `Create a new record in an Airtable base. Requires a connected Airtable integration.
  
  Use this tool to:
  - Add new records to Airtable tables
  - Set field values for the record
  - Work with various field types (text, number, select, date, etc.)
  
  The tool will automatically use the connected Airtable integration for the current project.`,
  
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    baseId: z.string().describe("Airtable base ID (starts with 'app')"),
    tableIdOrName: z.string().describe("Table ID or table name"),
    fields: z.record(z.string(), z.unknown()).describe("Record fields as key-value pairs (e.g., {'Name': 'John', 'Status': 'Active'})"),
  }),

  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  
  execute: async (input, { context }) => {
    const resolvedProjectId = input.projectId ?? context.projectId
    try {
      const { prisma } = await import("@/lib/db")
      const { getDecryptedToken } = await import("@/lib/services/integrations")

      // Find the Airtable integration for this project
      const integration = await prisma.integration.findFirst({
        where: {
          projectId: resolvedProjectId,
          provider: "airtable",
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
          error: "No active Airtable integration found for this project",
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
          error: "Failed to retrieve Airtable access token",
        }
      }

      // Build record payload
      const recordPayload = {
        fields: input.fields,
      }

      // Create the record
      const response = await fetch(
        `https://api.airtable.com/v0/${input.baseId}/${encodeURIComponent(input.tableIdOrName)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recordPayload),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create Airtable record: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        recordId: result.id,
        fields: result.fields,
        createdTime: result.createdTime,
        message: `Successfully created Airtable record in ${input.tableIdOrName}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  },
})
