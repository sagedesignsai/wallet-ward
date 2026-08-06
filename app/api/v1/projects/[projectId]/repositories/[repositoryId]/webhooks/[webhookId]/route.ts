import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { RepositoryService } from "@/lib/services/repository-service"
import { writeAuditLog } from "@/lib/services/audit"
import { getDecryptedToken } from "@/lib/services/integrations"
import { getOrganizationDek } from "@/lib/services/encryption-keys"
import { decryptString, type EncryptedPayload } from "@/lib/crypto"
import {
  requireAuth,
  requireOrganization,
  requirePermission,
} from "@/lib/api/auth"
import { handleRouteError, json } from "@/lib/api/http"
import { notFound } from "@/lib/api/errors"

// The URL GitHub delivers webhook payloads to
const WEBHOOK_CALLBACK_URL = `${
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}/api/webhooks/github`

/**
 * Parse a stored webhook secret. New rows store an encrypted envelope JSON
 * string; legacy rows store the raw plaintext (whsec_...). Returns null when
 * the value is not an envelope.
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
      algorithm: "aes-256-gcm",
    }
  } catch {
    return null
  }
}

/**
 * Decrypt a stored webhook secret with the org DEK. Falls back to the raw
 * stored value for legacy plaintext rows (or any undecryptable value).
 */
async function decryptWebhookSecret(
  raw: string,
  organizationId: string
): Promise<string> {
  const payload = parseEncryptedSecret(raw)
  if (!payload) {
    return raw
  }
  try {
    const dek = await getOrganizationDek(organizationId)
    return decryptString(payload, dek)
  } catch {
    return raw
  }
}

type Ctx = {
  params: Promise<{
    projectId: string
    repositoryId: string
    webhookId: string
  }>
}

/**
 * Best-effort: remove the GitHub hook before deleting the local row.
 * Never throws — failures are logged and the DB row is still deleted.
 *
 * Preferred path: the stored githubHookId lets us delete by id directly.
 * Legacy rows without one fall back to list-and-match using the decrypted
 * secret (handles both encrypted-envelope and legacy-plaintext storage).
 */
async function unregisterGitHubWebhook(input: {
  repository: { url: string }
  projectId: string
  organizationId: string
  githubHookId: string | null
  storedSecret: string
}): Promise<{ skippedAmbiguous: boolean }> {
  try {
    const parsed = RepositoryService.parseGitHubUrl(input.repository.url)
    if (!parsed) return { skippedAmbiguous: false }

    const integration = await db.integration.findFirst({
      where: { projectId: input.projectId, provider: "github", enabled: true },
      include: { project: true },
    })
    if (!integration) {
      console.error(
        "GitHub webhook unregister: no enabled GitHub integration found"
      )
      return { skippedAmbiguous: false }
    }

    let token: string
    try {
      token = await getDecryptedToken(integration)
    } catch (error) {
      console.error("GitHub webhook unregister: failed to decrypt token", error)
      return { skippedAmbiguous: false }
    }

    const baseUrl = `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/hooks`
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Flowspace",
      "X-GitHub-Api-Version": "2022-11-28",
    }

    // Preferred path: delete the hook by id — no list-and-match needed.
    if (input.githubHookId) {
      const delRes = await fetch(`${baseUrl}/${input.githubHookId}`, {
        method: "DELETE",
        headers,
      })
      if (!delRes.ok && delRes.status !== 404) {
        console.error(
          `GitHub webhook unregister: failed to delete hook ${input.githubHookId} (${delRes.status})`
        )
      }
      return { skippedAmbiguous: false }
    }

    // Legacy rows without a stored hook id: recover the plaintext secret
    // (encrypted envelope or legacy plaintext) for exact matching.
    const webhookSecret = await decryptWebhookSecret(
      input.storedSecret,
      input.organizationId
    )

    const hooksRes = await fetch(baseUrl, {
      headers,
    })
    if (!hooksRes.ok) {
      console.error(
        `GitHub webhook unregister: failed to list hooks (${hooksRes.status})`
      )
      return { skippedAmbiguous: false }
    }

    const hooks = (await hooksRes.json()) as Array<{
      id: number
      config?: { url?: string; secret?: string | null }
    }>

    // Prefer an exact URL+secret match; fall back to a URL-only match
    // (GitHub may omit the secret from the response for org-shared repos).
    const urlMatches = hooks.filter(
      (hook) => hook.config?.url === WEBHOOK_CALLBACK_URL
    )
    const exactMatch = urlMatches.find(
      (hook) => hook.config?.secret === webhookSecret
    )

    let target: { id: number } | undefined
    if (exactMatch) {
      target = exactMatch
    } else if (urlMatches.length === 1) {
      // URL-only fallback is safe only when exactly one hook uses the
      // callback URL — no ambiguity about whose hook it is.
      target = urlMatches[0]
    } else if (urlMatches.length > 1) {
      // Multiple hooks on the callback URL and the secret is omitted, so we
      // cannot tell which (if any) is ours. Deleting any of them could take
      // down another org's or another event's live hook, so delete nothing on
      // the GitHub side. The local row is still removed; the orphaned GitHub
      // hook keeps firing but the receiver ignores unknown/deleted rows.
      console.warn(
        "GitHub webhook unregister: ambiguous URL match (secret omitted), skipping GitHub deletion",
        { hookIds: urlMatches.map((hook) => hook.id) }
      )
      return { skippedAmbiguous: true }
    }

    if (!target) {
      console.error("GitHub webhook unregister: no matching GitHub hook found")
      return { skippedAmbiguous: false }
    }

    const delRes = await fetch(`${baseUrl}/${target.id}`, {
      method: "DELETE",
      headers,
    })
    if (!delRes.ok && delRes.status !== 404) {
      console.error(
        `GitHub webhook unregister: failed to delete hook ${target.id} (${delRes.status})`
      )
    }
    return { skippedAmbiguous: false }
  } catch (error) {
    console.error("GitHub webhook unregister failed:", error)
    return { skippedAmbiguous: false }
  }
}

/**
 * DELETE /api/v1/projects/:projectId/repositories/:repositoryId/webhooks/:webhookId
 * Unregister the webhook from GitHub, then delete the local row.
 */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { projectId, repositoryId, webhookId } = await ctx.params
    const authCtx = await requireAuth()
    const orgCtx = await requireOrganization(authCtx)
    requirePermission(orgCtx.memberRole, "project:write")

    // Verify project belongs to the organization
    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project || project.organizationId !== orgCtx.organizationId) {
      throw notFound("Project not found")
    }

    // Verify repository exists and belongs to project
    const repository = await db.repository.findUnique({
      where: { id: repositoryId },
    })
    if (!repository || repository.projectId !== projectId) {
      throw notFound("Repository not found")
    }

    // Verify webhook exists and belongs to repository
    const webhook = await db.repositoryWebhook.findUnique({
      where: { id: webhookId },
    })
    if (!webhook || webhook.repositoryId !== repositoryId) {
      throw notFound("Webhook not found")
    }

    // Unregister from GitHub first (best-effort — never blocks deletion)
    let skippedAmbiguous = false
    if (repository.provider === "github") {
      const result = await unregisterGitHubWebhook({
        repository: { url: repository.url },
        projectId,
        organizationId: orgCtx.organizationId,
        githubHookId: webhook.githubHookId,
        storedSecret: webhook.secret,
      })
      skippedAmbiguous = result.skippedAmbiguous
    }

    await db.repositoryWebhook.delete({
      where: { id: webhookId },
    })

    // When the legacy path skipped the GitHub deletion because it could not
    // tell which hook was ours, record it so the orphaned GitHub hook is
    // discoverable. Same audit conventions as the POST route.
    if (skippedAmbiguous) {
      await writeAuditLog({
        ctx: authCtx,
        organizationId: orgCtx.organizationId,
        action: "project_update",
        resourceType: "repository_webhook",
        resourceId: webhookId,
        metadata: {
          action: "delete_skipped_ambiguous",
          projectId,
          repositoryId,
          repositoryName: repository.name,
          event: webhook.event,
          url: webhook.url,
          webhookId,
        },
      })
    }

    // Log audit event
    await writeAuditLog({
      ctx: authCtx,
      organizationId: orgCtx.organizationId,
      action: "project_update",
      resourceType: "repository_webhook",
      resourceId: webhookId,
      metadata: {
        action: "delete",
        projectId,
        repositoryId,
        repositoryName: repository.name,
        event: webhook.event,
        url: webhook.url,
      },
    })

    return json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
