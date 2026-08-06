import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { RepositoryService } from "@/lib/services/repository-service"
import { writeAuditLog } from "@/lib/services/audit"
import { getDecryptedToken } from "@/lib/services/integrations"
import { getOrganizationDek } from "@/lib/services/encryption-keys"
import {
  decryptString,
  encryptString,
  type EncryptedPayload,
} from "@/lib/crypto"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { badRequest, notFound } from "@/lib/api/errors"
import crypto from "crypto"

// The URL GitHub delivers webhook payloads to
const WEBHOOK_CALLBACK_URL = `${
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}/api/webhooks/github`

const VALID_EVENTS = [
  "push",
  "pull_request",
  "release",
  "tag",
  "issue",
  "commit_comment",
]

/**
 * Generate a random HMAC secret for webhook signature verification
 */
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`
}

/**
 * Parse a stored secret envelope. Returns null when the value is not a valid
 * aes-256-gcm envelope (legacy plaintext secret).
 */
function parseEncryptedSecret(raw: string): EncryptedPayload | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof parsed.ciphertext !== "string" ||
      typeof parsed.iv !== "string" ||
      typeof parsed.authTag !== "string" ||
      parsed.algorithm !== "aes-256-gcm"
    ) {
      return null
    }
    return {
      ciphertext: parsed.ciphertext,
      iv: parsed.iv,
      authTag: parsed.authTag,
      algorithm: parsed.algorithm,
    }
  } catch {
    return null
  }
}

/**
 * Return the plaintext HMAC secret for a stored webhook: decrypt the envelope
 * with the org DEK, falling back to the raw value for legacy plaintext rows.
 */
async function decryptStoredSecret(
  stored: string,
  organizationId: string
): Promise<string> {
  const envelope = parseEncryptedSecret(stored)
  if (!envelope) return stored
  try {
    const dek = await getOrganizationDek(organizationId)
    return decryptString(envelope, dek)
  } catch {
    return stored
  }
}

type Ctx = { params: Promise<{ projectId: string; repositoryId: string }> }

/**
 * Load the project + repository, verifying they belong to the organization.
 */
async function loadProjectAndRepository(
  projectId: string,
  repositoryId: string,
  organizationId: string
) {
  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project || project.organizationId !== organizationId) {
    throw notFound("Project not found")
  }

  const repository = await db.repository.findUnique({
    where: { id: repositoryId },
  })
  if (!repository || repository.projectId !== projectId) {
    throw notFound("Repository not found")
  }

  return { project, repository }
}

/**
 * Register a webhook on GitHub. Returns the created hook's GitHub id (null
 * when unavailable) plus an error reason (null on success).
 */
async function registerGitHubWebhook(input: {
  repository: { url: string }
  projectId: string
  event: string
  secret: string
}): Promise<{ hookId: number | null; error: string | null }> {
  const parsed = RepositoryService.parseGitHubUrl(input.repository.url)
  if (!parsed) {
    return { hookId: null, error: "could not parse repository URL" }
  }

  const integration = await db.integration.findFirst({
    where: { projectId: input.projectId, provider: "github", enabled: true },
    include: { project: true },
  })
  if (!integration) {
    return {
      hookId: null,
      error: "no enabled GitHub integration found for this project",
    }
  }

  let token: string
  try {
    token = await getDecryptedToken(integration)
  } catch (error) {
    return {
      hookId: null,
      error:
        error instanceof Error
          ? error.message
          : "could not decrypt GitHub token",
    }
  }

  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Flowspace",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: [input.event],
        config: {
          url: WEBHOOK_CALLBACK_URL,
          content_type: "json",
          secret: input.secret,
          insecure_ssl: "0",
        },
      }),
    }
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return {
      hookId: null,
      error: `GitHub API error (${res.status})${detail ? `: ${detail}` : ""}`,
    }
  }

  // GitHub returns the created hook, including its id — capture it so later
  // deletion can target the hook by id instead of list-and-match.
  const created = (await res.json().catch(() => null)) as { id?: number } | null
  return { hookId: created?.id ?? null, error: null }
}

/**
 * GET /api/v1/projects/:projectId/repositories/:repositoryId/webhooks
 * List webhooks for a repository
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { projectId, repositoryId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:read")

    const { repository } = await loadProjectAndRepository(
      projectId,
      repositoryId,
      orgCtx.organizationId
    )

    const webhooks = await db.repositoryWebhook.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
    })

    // Never expose the HMAC secret or the GitHub hook id to project:read
    // members (e.g. viewers). The secret is only returned to the creator in
    // the POST response; githubHookId is an internal handle for deletion.
    const data = webhooks.map((webhook) => ({
      id: webhook.id,
      repositoryId: webhook.repositoryId,
      event: webhook.event,
      url: webhook.url,
      enabled: webhook.enabled,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    }))

    return json({ data, meta: { provider: repository.provider } })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST /api/v1/projects/:projectId/repositories/:repositoryId/webhooks
 * Create a new webhook for a repository and register it with GitHub.
 *
 * Body:
 *   event   — WebhookEvent enum value (push, pull_request, release, tag, issue, commit_comment)
 *   url     — The URL to receive webhook payloads
 *   enabled — Optional, defaults to true
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { projectId, repositoryId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    const { repository } = await loadProjectAndRepository(
      projectId,
      repositoryId,
      orgCtx.organizationId
    )

    const body = await req.json()

    // Validate required fields
    if (!body.event || !body.url) {
      throw badRequest("Missing required fields: event, url")
    }

    // Validate event is a valid WebhookEvent enum value
    if (!VALID_EVENTS.includes(body.event)) {
      throw badRequest(
        `Invalid event. Must be one of: ${VALID_EVENTS.join(", ")}`
      )
    }

    // Idempotent creation: registering the same (repository, event, url)
    // twice would create a duplicate GitHub hook. When an identical webhook
    // already exists, return it — including its plaintext secret — instead
    // of registering a second hook.
    const existing = await db.repositoryWebhook.findFirst({
      where: { repositoryId, event: body.event, url: body.url },
    })
    if (existing) {
      const existingSecret = await decryptStoredSecret(
        existing.secret,
        orgCtx.organizationId
      )
      return json(
        {
          data: {
            id: existing.id,
            repositoryId: existing.repositoryId,
            event: existing.event,
            url: existing.url,
            enabled: existing.enabled,
            secret: existingSecret,
            githubHookId: existing.githubHookId,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          },
        },
        { status: 201 }
      )
    }

    // Generate a unique HMAC secret for signature verification
    const secret = generateWebhookSecret()

    // Encrypt the secret at rest with the org DEK (envelope format). GitHub
    // receives the PLAINTEXT secret in the registration config; only the
    // encrypted envelope is persisted.
    const dek = await getOrganizationDek(orgCtx.organizationId)
    const encryptedSecret = JSON.stringify(encryptString(secret, dek))

    let webhook = await db.repositoryWebhook.create({
      data: {
        repositoryId,
        event: body.event,
        url: body.url,
        secret: encryptedSecret,
        enabled: body.enabled !== undefined ? body.enabled : true,
      },
    })

    // Register the hook with GitHub. On failure, roll back the inert DB row —
    // never leave rows that GitHub does not know about.
    if (repository.provider === "github") {
      const result = await registerGitHubWebhook({
        repository: { url: repository.url },
        projectId,
        event: webhook.event,
        secret,
      })

      if (result.error) {
        await db.repositoryWebhook.delete({ where: { id: webhook.id } })
        throw badRequest(
          `Failed to register webhook with GitHub: ${result.error}`
        )
      }

      // Store the GitHub hook id so deletion is by-id (no list-and-match).
      if (result.hookId != null) {
        webhook = await db.repositoryWebhook.update({
          where: { id: webhook.id },
          data: { githubHookId: String(result.hookId) },
        })
      }
    }

    // Log audit event (only for hooks that were actually registered)
    await writeAuditLog({
      ctx: authCtx,
      organizationId: orgCtx.organizationId,
      action: "project_update",
      resourceType: "repository_webhook",
      resourceId: webhook.id,
      metadata: {
        action: "create",
        projectId,
        repositoryId,
        repositoryName: repository.name,
        event: webhook.event,
        url: webhook.url,
      },
    })

    // Return the creator-facing DTO. The HMAC secret is only returned here
    // (in plaintext) — the stored value is the encrypted envelope.
    return json(
      {
        data: {
          id: webhook.id,
          repositoryId: webhook.repositoryId,
          event: webhook.event,
          url: webhook.url,
          enabled: webhook.enabled,
          secret,
          githubHookId: webhook.githubHookId,
          createdAt: webhook.createdAt,
          updatedAt: webhook.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
