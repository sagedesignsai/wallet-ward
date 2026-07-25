import { z } from "zod"
import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/db"
import { decryptString, encryptString, type EncryptedPayload } from "@/lib/crypto"
import { notFound, badRequest } from "@/lib/api/errors"
import { getOrganizationDek } from "@/lib/services/encryption-keys"
import { writeAuditLog } from "@/lib/services/audit"
import type { AuthContext } from "@/lib/api/auth"

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const createIntegrationSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(["github"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const githubConnectSchema = z.object({
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
