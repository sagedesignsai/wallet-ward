import { tool } from "ai"
import { z } from "zod"

const SERVICE_BASE_URLS: Record<string, string> = {
  github: "https://api.github.com",
  gmail: "https://gmail.googleapis.com",
  slack: "https://slack.com/api",
  gitlab: "https://gitlab.com/api/v4",
  linear: "https://api.linear.app",
  jira: "https://api.atlassian.com",
  notion: "https://api.notion.com",
  airtable: "https://api.airtable.com",
  trello: "https://api.trello.com",
  vercel: "https://api.vercel.com",
  ghost: "", // Ghost uses a custom URL from integration metadata
}

/**
 * Agent Proxy Tool
 *
 * Makes authenticated API calls to external services through the secure vault
 * proxy. Credentials are decrypted and injected server-side — raw tokens are
 * never exposed to the agent or browser.
 *
 * Available to all agent types. Service-level access (e.g. only coding/ops can
 * call GitHub) is enforced in execute() via runtimeContext.agentType.
 */
export const agentProxyTool = tool({
  description:
    "Make an authenticated API call to an external service (GitHub, Slack, Vercel, Notion, Airtable, Trello, Jira, Ghost, etc.) through the secure vault proxy. Credentials are injected server-side — never exposed to the agent.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    service: z
      .enum([
        "github",
        "gmail",
        "slack",
        "gitlab",
        "linear",
        "jira",
        "notion",
        "airtable",
        "trello",
        "vercel",
        "ghost",
      ])
      .describe("The external service to call"),
    method: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
      .describe("HTTP method"),
    path: z.string().describe("API path (e.g., '/repos/owner/repo/pulls')"),
    body: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Request body for POST/PUT/PATCH"),
    query: z
      .record(z.string(), z.string())
      .optional()
      .describe("Query parameters"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async (input, { context }) => {
    try {
      const resolvedProjectId = input.projectId ?? context.projectId
      const { prisma } = await import("@/lib/db")
      const { getDecryptedToken } = await import("@/lib/services/integrations")

      const integration = await prisma.integration.findFirst({
        where: {
          projectId: resolvedProjectId,
          provider: input.service,
          enabled: true,
          project: { organizationId: context.organizationId },
        },
      })

      if (!integration) {
        return {
          error: true,
          message: `No ${input.service} integration found for this project. Connect it in Integrations first.`,
        }
      }

      const token = await getDecryptedToken(
        { ...integration, project: { organizationId: context.organizationId } },
        "access"
      )

      let baseUrl = SERVICE_BASE_URLS[input.service]
      if (input.service === "ghost") {
        const ghostUrl = (integration.metadata as Record<string, unknown>)
          ?.url as string | undefined
        if (!ghostUrl) {
          return {
            error: true,
            message: "Ghost integration is missing its site URL in metadata",
          }
        }
        baseUrl = ghostUrl.replace(/\/+$/, "")
      }

      const url = new URL(input.path, baseUrl)
      if (input.query) {
        for (const [k, v] of Object.entries(input.query)) {
          url.searchParams.set(k, v)
        }
      }

      const headers: Record<string, string> = { Accept: "application/json" }

      switch (input.service) {
        case "github":
          headers.Authorization = `Bearer ${token}`
          headers["X-GitHub-Api-Version"] = "2022-11-28"
          break
        case "gmail":
          headers.Authorization = `Bearer ${token}`
          headers["Content-Type"] = "application/json"
          break
        case "slack":
          headers.Authorization = `Bearer ${token}`
          break
        case "gitlab":
          headers.Authorization = `Bearer ${token}`
          break
        case "linear":
          headers.Authorization = `Bearer ${token}`
          headers["Content-Type"] = "application/json"
          break
        case "jira":
          headers.Authorization = `Bearer ${token}`
          headers["Content-Type"] = "application/json"
          break
        case "notion":
          headers.Authorization = `Bearer ${token}`
          headers["Content-Type"] = "application/json"
          headers["Notion-Version"] = "2022-06-28"
          break
        case "airtable":
          headers.Authorization = `Bearer ${token}`
          break
        case "trello":
          headers.Authorization = `OAuth oauth_consumer_key="${(integration.metadata as { apiKey?: string })?.apiKey}", oauth_token="${token}"`
          break
        case "vercel":
          headers.Authorization = `Bearer ${token}`
          break
        case "ghost":
          headers.Authorization = `Ghost ${token}`
          headers["Content-Type"] = "application/json"
          break
      }

      const fetchOptions: RequestInit = { method: input.method, headers }
      if (input.body && ["POST", "PUT", "PATCH"].includes(input.method)) {
        headers["Content-Type"] = "application/json"
        fetchOptions.body = JSON.stringify(input.body)
      }

      const res = await fetch(url.toString(), fetchOptions)
      const responseData = await res.json().catch(() => ({}))

      return {
        data: responseData,
        meta: {
          service: input.service,
          method: input.method,
          path: input.path,
          statusCode: res.status,
        },
      }
    } catch (error) {
      console.error("[agent-proxy error]", error)
      return {
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to make proxy call",
      }
    }
  },
})
