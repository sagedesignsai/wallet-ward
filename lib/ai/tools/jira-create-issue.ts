import { tool } from "ai"
import { z } from "zod"
import { getDecryptedToken } from "@/lib/services/integrations"
import { prisma } from "@/lib/db"

export const jiraCreateIssueTool = tool({
  description: `Create a new issue in Jira. Requires a connected Jira integration.
  
  Use this tool to:
  - Create tasks, bugs, stories, or epics in Jira
  - Set issue details like summary, description, priority, assignee
  - Link issues to projects and sprints
  
  The tool will automatically use the connected Jira integration for the current project.`,
  
  inputSchema: z.object({
    projectId: z.string().describe("The project ID that has the Jira integration"),
    summary: z.string().min(1).describe("Brief summary of the issue (required)"),
    description: z.string().optional().describe("Detailed description of the issue (supports Jira markdown)"),
    issueType: z.enum(["Task", "Bug", "Story", "Epic"]).default("Task").describe("Type of issue to create"),
    priority: z.enum(["Highest", "High", "Medium", "Low", "Lowest"]).optional().describe("Priority level"),
    jiraProjectKey: z.string().describe("Jira project key (e.g., 'PROJ', 'DEV')"),
    assigneeAccountId: z.string().optional().describe("Jira account ID of the assignee"),
    labels: z.array(z.string()).optional().describe("Labels to add to the issue"),
  }),
  
  execute: async (input) => {
    try {
      // Find the Jira integration for this project
      const integration = await prisma.integration.findFirst({
        where: {
          projectId: input.projectId,
          provider: "jira",
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
          error: "No active Jira integration found for this project",
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
          error: "Failed to retrieve Jira access token",
        }
      }

      // Get cloud ID from metadata
      const cloudId = (integration.metadata as { cloudId?: string })?.cloudId
      if (!cloudId) {
        return {
          success: false,
          error: "Jira cloud ID not found in integration metadata",
        }
      }

      // Build issue payload
      const issuePayload: { fields: Record<string, unknown> } = {
        fields: {
          project: {
            key: input.jiraProjectKey,
          },
          summary: input.summary,
          issuetype: {
            name: input.issueType,
          },
        },
      }

      // Add optional fields
      if (input.description) {
        issuePayload.fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: input.description,
                },
              ],
            },
          ],
        }
      }

      if (input.priority) {
        issuePayload.fields.priority = { name: input.priority }
      }

      if (input.assigneeAccountId) {
        issuePayload.fields.assignee = { accountId: input.assigneeAccountId }
      }

      if (input.labels && input.labels.length > 0) {
        issuePayload.fields.labels = input.labels
      }

      // Create the issue
      const response = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(issuePayload),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create Jira issue: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        issueKey: result.key,
        issueId: result.id,
        issueUrl: `${(integration.metadata as { siteUrl?: string })?.siteUrl}/browse/${result.key}`,
        message: `Successfully created Jira issue ${result.key}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  },
})
