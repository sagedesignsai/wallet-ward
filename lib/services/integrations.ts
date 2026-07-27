import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { decryptString, encryptString, type EncryptedPayload } from "@/lib/crypto"
import { notFound, badRequest } from "@/lib/api/errors"
import { getOrganizationDek } from "@/lib/services/encryption-keys"
import { writeAuditLog } from "@/lib/services/audit"
import type { AuthContext } from "@/lib/api/auth"

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const createIntegrationSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(["github", "gmail", "slack", "gitlab", "linear", "jira", "notion", "airtable", "trello", "ghost"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const githubConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const gmailConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const slackConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const gitlabConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const linearConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const jiraConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const notionConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const airtableConnectSchema = z.object({
  projectId: z.string().min(1),
})

export const trelloConnectSchema = z.object({
  projectId: z.string().min(1),
})




// ─── DTO helpers ──────────────────────────────────────────────────────────────

export function toIntegrationDto(integration: {
  id: string
  projectId: string
  provider: string
  name: string
  metadata: unknown
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: integration.id,
    projectId: integration.projectId,
    provider: integration.provider,
    name: integration.name,
    metadata: integration.metadata,
    enabled: integration.enabled,
    createdAt: integration.createdAt.toISOString(),
    updatedAt: integration.updatedAt.toISOString(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseEncryptedPayload(raw: string): EncryptedPayload {
  const parsed = JSON.parse(raw) as Record<string, unknown>
  return {
    ciphertext: parsed.ciphertext as string,
    iv: parsed.iv as string,
    authTag: parsed.authTag as string,
    algorithm: "aes-256-gcm",
  }
}

/** Verify that a project belongs to the given organization. */
async function assertProjectInOrg(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  })
  if (!project) throw notFound("Project not found")
  return project
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listIntegrations(projectId: string, organizationId: string) {
  await assertProjectInOrg(projectId, organizationId)
  const integrations = await prisma.integration.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
  return integrations.map(toIntegrationDto)
}

export async function getIntegration(integrationId: string, organizationId: string) {
  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, project: { organizationId } },
  })
  if (!integration) throw notFound("Integration not found")
  return integration
}

export async function createIntegration(input: {
  ctx: AuthContext
  organizationId: string
  projectId: string
  name: string
  provider: string
  metadata?: Record<string, unknown>
}) {
  await assertProjectInOrg(input.projectId, input.organizationId)

  const integration = await prisma.integration.create({
    data: {
      projectId: input.projectId,
      provider: input.provider,
      name: input.name,
      metadata: (input.metadata ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "integration_create",
    resourceType: "integration",
    resourceId: integration.id,
    metadata: { name: integration.name, provider: integration.provider },
  })

  return toIntegrationDto(integration)
}

export async function deleteIntegration(input: {
  ctx: AuthContext
  organizationId: string
  integrationId: string
}) {
  const integration = await getIntegration(input.integrationId, input.organizationId)
  await prisma.integration.delete({ where: { id: integration.id } })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "integration_delete",
    resourceType: "integration",
    resourceId: integration.id,
    metadata: { name: integration.name, provider: integration.provider },
  })
}

export async function updateIntegration(input: {
  ctx: AuthContext
  organizationId: string
  integrationId: string
  enabled?: boolean
  name?: string
}) {
  const integration = await getIntegration(input.integrationId, input.organizationId)

  const updated = await prisma.integration.update({
    where: { id: integration.id },
    data: {
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
    },
  })

  return toIntegrationDto(updated)
}

// ─── OAuth state helpers ──────────────────────────────────────────────────────

export async function createOAuthState(projectId: string): Promise<string> {
  const nonce = crypto.randomUUID()
  const state = JSON.stringify({ projectId, nonce })
  const stateToken = Buffer.from(state).toString("base64url")

  // Store in Verification table for 10 minutes
  await prisma.verification.create({
    data: {
      identifier: `github_oauth:${stateToken}`,
      value: projectId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  return stateToken
}

export async function consumeOAuthState(state: string): Promise<string> {
  const verification = await prisma.verification.findFirst({
    where: {
      identifier: `github_oauth:${state}`,
      expiresAt: { gt: new Date() },
    },
  })
  if (!verification) {
    throw badRequest("Invalid or expired OAuth state")
  }

  // Delete the verification (one-time use)
  await prisma.verification.delete({ where: { id: verification.id } })

  return verification.value // This is the projectId
}

// ─── Encrypted token storage ──────────────────────────────────────────────────

export async function storeEncryptedToken(
  integrationId: string,
  token: string,
  organizationId: string,
  type: "access" | "refresh" = "access"
) {
  const dek = await getOrganizationDek(organizationId)
  const encrypted = encryptString(token, dek)
  const payloadJson = JSON.stringify(encrypted)

  await prisma.integration.update({
    where: { id: integrationId },
    data:
      type === "access"
        ? { accessTokenEncrypted: payloadJson }
        : { refreshTokenEncrypted: payloadJson },
  })
}

export async function getDecryptedToken(
  integration: {
    accessTokenEncrypted: string | null
    refreshTokenEncrypted: string | null
    project: { organizationId: string }
  },
  type: "access" | "refresh" = "access"
): Promise<string> {
  const raw = type === "access"
    ? integration.accessTokenEncrypted
    : integration.refreshTokenEncrypted

  if (!raw) {
    throw badRequest(`No ${type} token stored for this integration`)
  }

  const dek = await getOrganizationDek(integration.project.organizationId)
  return decryptString(parseEncryptedPayload(raw), dek)
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshTokenIfNeeded(
  integrationId: string,
  organizationId: string
): Promise<boolean> {
  const integration = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      project: { organizationId },
    },
    include: { project: true },
  })

  if (!integration) {
    throw notFound("Integration not found")
  }

  // Check if token is about to expire (within 5 minutes)
  if (
    !integration.tokenExpiresAt ||
    new Date() < new Date(integration.tokenExpiresAt.getTime() - 5 * 60 * 1000)
  ) {
    return false // Token still valid
  }

  // Check if we have a refresh token
  if (!integration.refreshTokenEncrypted) {
    throw badRequest("No refresh token available for this integration")
  }

  // Decrypt refresh token
  const refreshToken = await getDecryptedToken(integration, "refresh")

  // Provider-specific refresh logic
  let newAccessToken: string
  let newRefreshToken: string | null = null
  let expiresIn: number | null = null

  switch (integration.provider) {
    case "github":
      // GitHub tokens don't expire, but we support the pattern
      throw badRequest("GitHub tokens do not require refresh")

    case "gmail":
    case "google": {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      })

      if (!tokenRes.ok) {
        throw badRequest("Failed to refresh Google token")
      }

      const tokenData = (await tokenRes.json()) as {
        access_token: string
        expires_in?: number
        refresh_token?: string
      }

      newAccessToken = tokenData.access_token
      newRefreshToken = tokenData.refresh_token ?? null
      expiresIn = tokenData.expires_in ?? null
      break
    }

    default:
      throw badRequest(`Token refresh not implemented for provider: ${integration.provider}`)
  }

  // Store new tokens
  await storeEncryptedToken(integrationId, newAccessToken, organizationId, "access")

  if (newRefreshToken) {
    await storeEncryptedToken(integrationId, newRefreshToken, organizationId, "refresh")
  }

  // Update expiry and refresh timestamp
  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      tokenExpiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null,
      lastRefreshedAt: new Date(),
    },
  })

  return true
}

// ─── Sandbox credential injection ─────────────────────────────────────────────

const SERVICE_BASE_URLS: Record<string, string> = {
  github: "https://api.github.com",
  gmail: "https://gmail.googleapis.com",
  google: "https://www.googleapis.com",
  slack: "https://slack.com/api",
  vercel: "https://api.vercel.com",
}

export async function injectIntegrationCredentials(
  sandboxId: string,
  projectId: string,
  organizationId: string
): Promise<{ injected: string[]; errors: string[] }> {
  // Get all enabled integrations for project
  const integrations = await prisma.integration.findMany({
    where: {
      projectId,
      enabled: true,
      project: { organizationId },
    },
    include: { project: true },
  })

  if (integrations.length === 0) {
    return { injected: [], errors: [] }
  }

  const envVars: Record<string, string> = {}
  const injected: string[] = []
  const errors: string[] = []

  // Decrypt tokens and prepare env vars
  for (const integration of integrations) {
    try {
      // Refresh token if needed
      await refreshTokenIfNeeded(integration.id, organizationId)

      // Get decrypted access token
      const token = await getDecryptedToken(integration, "access")

      // Set provider-specific env vars
      const providerUpper = integration.provider.toUpperCase()
      envVars[`${providerUpper}_TOKEN`] = token
      envVars[`${providerUpper}_API_URL`] = SERVICE_BASE_URLS[integration.provider] || ""
      
      // Add scopes if available
      if (integration.scopes && integration.scopes.length > 0) {
        envVars[`${providerUpper}_SCOPES`] = integration.scopes.join(",")
      }

      injected.push(integration.provider)
    } catch (error) {
      errors.push(
        `Failed to inject ${integration.provider}: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  // Inject into Daytona sandbox using the SDK's updateEnv method
  if (Object.keys(envVars).length > 0) {
    try {
      const { getDaytonaClient } = await import("@/lib/daytona")
      const client = getDaytonaClient()
      
      if (!client) {
        throw new Error("Daytona client not configured")
      }

      const sandbox = await client.get(sandboxId)
      await sandbox.updateEnv(envVars)
    } catch (error) {
      errors.push(
        `Failed to inject credentials into sandbox: ${error instanceof Error ? error.message : "Unknown error"}`
      )
      return { injected: [], errors }
    }
  }

  // Log credential injection
  await writeAuditLog({
    ctx: { userId: "system", actorType: "api_key" as const },
    organizationId,
    action: "agent_proxy_call" as any, // Using existing audit action
    resourceType: "sandbox",
    resourceId: sandboxId,
    metadata: {
      action: "inject_credentials",
      providers: injected,
      projectId,
    },
  })

  return { injected, errors }
}

export async function revokeIntegrationCredentials(
  sandboxId: string,
  organizationId: string
): Promise<void> {
  const { getDaytonaClient } = await import("@/lib/daytona")
  
  const client = getDaytonaClient()
  if (!client) return

  try {
    const sandbox = await client.get(sandboxId)
    
    // Remove all integration-related env vars using updateEnv with unset option
    const envVarsToRemove = Object.keys(SERVICE_BASE_URLS).flatMap((provider) => {
      const upper = provider.toUpperCase()
      return [`${upper}_TOKEN`, `${upper}_API_URL`, `${upper}_SCOPES`]
    })

    await sandbox.updateEnv({}, { unset: envVarsToRemove })

    await writeAuditLog({
      ctx: { userId: "system", actorType: "api_key" as const },
      organizationId,
      action: "agent_proxy_call" as any,
      resourceType: "sandbox",
      resourceId: sandboxId,
      metadata: { action: "revoke_credentials" },
    })
  } catch (error) {
    console.error("Failed to revoke sandbox credentials:", error)
  }
}

// ─── GitHub API service ───────────────────────────────────────────────────────

const GITHUB_API = "https://api.github.com"

async function githubFetch(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw badRequest(`GitHub API error (${res.status}): ${body}`)
  }

  return res.json()
}

export async function fetchGitHubRepos(accessToken: string) {
  return githubFetch(`${GITHUB_API}/user/repos?per_page=30&sort=updated`, accessToken)
}

export async function fetchGitHubPullRequests(
  accessToken: string,
  owner: string,
  repo: string
) {
  return githubFetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=all&per_page=10`,
    accessToken
  )
}

export async function fetchGitHubCommits(
  accessToken: string,
  owner: string,
  repo: string
) {
  return githubFetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=10`,
    accessToken
  )
}
