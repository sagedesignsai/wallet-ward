import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { RepositoryService } from "@/lib/services/repository-service"
import { getDecryptedToken } from "@/lib/services/integrations"
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
 */
async function unregisterGitHubWebhook(input: {
  repository: { url: string }
  projectId: string
  webhookSecret: string
}): Promise<void> {
  try {
    const parsed = RepositoryService.parseGitHubUrl(input.repository.url)
    if (!parsed) return

    const integration = await db.integration.findFirst({
      where: { projectId: input.projectId, provider: "github", enabled: true },
      include: { project: true },
    })
    if (!integration) {
      console.error(
        "GitHub webhook unregister: no enabled GitHub integration found"
      )
      return
    }

    let token: string
    try {
      token = await getDecryptedToken(integration)
    } catch (error) {
      console.error("GitHub webhook unregister: failed to decrypt token", error)
      return
    }

    const hooksRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/hooks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Flowspace",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )
    if (!hooksRes.ok) {
      console.error(
        `GitHub webhook unregister: failed to list hooks (${hooksRes.status})`
      )
      return
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
      (hook) => hook.config?.secret === input.webhookSecret
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
      return
    }

    if (!target) {
      console.error(
        "GitHub webhook unregister: no matching GitHub hook found"
      )
      return
    }

    const delRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/hooks/${target.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Flowspace",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )
    if (!delRes.ok && delRes.status !== 404) {
      console.error(
        `GitHub webhook unregister: failed to delete hook ${target.id} (${delRes.status})`
      )
    }
  } catch (error) {
    console.error("GitHub webhook unregister failed:", error)
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
    if (repository.provider === "github") {
      await unregisterGitHubWebhook({
        repository: { url: repository.url },
        projectId,
        webhookSecret: webhook.secret,
      })
    }

    await db.repositoryWebhook.delete({
      where: { id: webhookId },
    })

    // Log audit event
    await db.auditLog.create({
      data: {
        organizationId: orgCtx.organizationId,
        actorUserId: authCtx.userId,
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
      },
    })

    return json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
