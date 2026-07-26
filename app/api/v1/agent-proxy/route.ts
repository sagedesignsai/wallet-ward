import { z } from "zod"
import { prisma } from "@/lib/db"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { notFound } from "@/lib/api/errors"
import { getDecryptedToken } from "@/lib/services/integrations"
import { writeAuditLog } from "@/lib/services/audit"

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_BASE_URLS: Record<string, string> = {
  github: "https://api.github.com",
  slack: "https://slack.com/api",
  vercel: "https://api.vercel.com",
}

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const

// ─── Zod schema ───────────────────────────────────────────────────────────────

const proxyRequestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  service: z.enum(["github", "slack", "vercel"]),
  method: z.enum(ALLOWED_METHODS),
  path: z.string().min(1, "path is required").startsWith("/", "path must start with /"),
  body: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.string()).optional(),
})

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const jsonBody = await request.json()
    const input = proxyRequestSchema.parse(jsonBody)

    // Find the integration for this service in this project, scoped to the org
    const integration = await prisma.integration.findFirst({
      where: {
        projectId: input.projectId,
        provider: input.service,
        enabled: true,
        project: { organizationId: orgCtx.organizationId },
      },
    })

    if (!integration) {
      throw notFound(
        `No enabled ${input.service} integration found for this project`
      )
    }

    // Decrypt the access token server-side
    const token = await getDecryptedToken(
      { ...integration, project: { organizationId: orgCtx.organizationId } },
      "access"
    )

    // Build the full URL
    const baseUrl = SERVICE_BASE_URLS[input.service]
    const url = new URL(input.path, baseUrl)

    if (input.query) {
      for (const [k, v] of Object.entries(input.query)) {
        url.searchParams.set(k, v)
      }
    }

    // Build request headers with service-specific auth
    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    switch (input.service) {
      case "github":
        headers.Authorization = `Bearer ${token}`
        headers["X-GitHub-Api-Version"] = "2022-11-28"
        break
      case "slack":
        headers.Authorization = `Bearer ${token}`
        break
      case "vercel":
        headers.Authorization = `Bearer ${token}`
        break
    }

    const fetchOptions: RequestInit = {
      method: input.method,
      headers,
    }

    if (input.body && ["POST", "PUT", "PATCH"].includes(input.method)) {
      headers["Content-Type"] = "application/json"
      fetchOptions.body = JSON.stringify(input.body)
    }

    // Execute the proxied request
    const res = await fetch(url.toString(), fetchOptions)
    const responseData = await res.json().catch(() => ({}))

    // Best-effort audit log — never fail the proxy call
    writeAuditLog({
      ctx: authCtx,
      organizationId: orgCtx.organizationId,
      action: "agent_proxy_call",
      resourceType: "integration",
      resourceId: integration.id,
      metadata: {
        service: input.service,
        method: input.method,
        path: input.path,
        statusCode: res.status,
      },
    }).catch(() => {})

    // Return the upstream response
    return json({
      data: responseData,
      meta: {
        service: input.service,
        method: input.method,
        path: input.path,
        statusCode: res.status,
      },
    })
  } catch (error) {
    // If the upstream API returned a non-2xx, wrap it in our error envelope
    if (
      error instanceof Error &&
      error.message.startsWith("Upstream API error")
    ) {
      return json(
        {
          error: {
            code: "proxy_error",
            message: error.message,
          },
        },
        { status: 502 }
      )
    }
    return handleRouteError(error)
  }
}
