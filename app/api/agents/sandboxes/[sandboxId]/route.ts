import { handleRouteError, json } from "@/lib/api/http"
import { requireAuth, requireOrganization } from "@/lib/api/auth"
import { notFound } from "@/lib/api/errors"
import { db } from "@/lib/db"
import { bestEffortAuditWrite } from "@/lib/ai/telemetry"
import {
  getSandbox,
  stopSandbox,
  startSandbox,
  deleteSandbox,
  getSandboxPreviewUrl,
  getDesktopUrl,
  getWebTerminalUrl,
} from "@/lib/daytona"

/**
 * Sandboxes are owned via AgentSession.daytonaSandboxId → project → org.
 * Reject any access to a sandbox that isn't linked to a session in the
 * caller's organization (prevents re-resolving signed URLs for foreign
 * sandboxes, e.g. through persisted desktop window refs).
 */
async function assertSandboxInOrg(sandboxId: string, organizationId: string) {
  const session = await db.agentSession.findFirst({
    where: {
      daytonaSandboxId: sandboxId,
      project: { organizationId },
    },
    select: { id: true },
  })
  if (!session) throw notFound("Sandbox not found")
}

// ---------------------------------------------------------------------------
// GET /api/agents/sandboxes/:sandboxId — Get a single sandbox
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  try {
    const authCtx = await requireAuth()

    if (!process.env.DAYTONA_API_KEY) {
      return json(
        {
          error: {
            code: "not_configured",
            message:
              "Daytona is not configured. Add DAYTONA_API_KEY to your environment to enable sandbox management.",
          },
        },
        { status: 503 }
      )
    }

    const { sandboxId } = await params
    const orgCtx = await requireOrganization(authCtx)
    await assertSandboxInOrg(sandboxId, orgCtx.organizationId)
    const sandbox = await getSandbox(sandboxId)
    return json({ data: sandbox })
  } catch (error) {
    return handleRouteError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/agents/sandboxes/:sandboxId — Stop, Start, or Delete a sandbox
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  try {
    const authCtx = await requireAuth()

    if (!process.env.DAYTONA_API_KEY) {
      return json(
        {
          error: {
            code: "not_configured",
            message:
              "Daytona is not configured. Add DAYTONA_API_KEY to your environment to enable sandbox management.",
          },
        },
        { status: 503 }
      )
    }

    const { sandboxId } = await params
    const orgCtx = await requireOrganization(authCtx)
    await assertSandboxInOrg(sandboxId, orgCtx.organizationId)
    const body = await request.json()
    const action = body.action as string | undefined

    if (
      !action ||
      !["stop", "start", "delete", "preview", "desktop", "web-terminal"].includes(
        action
      )
    ) {
      return json(
        {
          error: {
            code: "validation_error",
            message:
              "A valid action is required: 'stop', 'start', 'delete', 'preview', 'desktop', or 'web-terminal'.",
          },
        },
        { status: 400 }
      )
    }

    switch (action) {
      case "stop":
        await stopSandbox(sandboxId)
        return json({ data: { success: true, action: "stop" } })

      case "start":
        await startSandbox(sandboxId)
        return json({ data: { success: true, action: "start" } })

      case "delete":
        await deleteSandbox(sandboxId)
        // Best-effort audit log — never fail the delete, never swallow
        // failures silently (audit evidence must not vanish without trace).
        bestEffortAuditWrite({
          ctx: authCtx,
          organizationId: orgCtx.organizationId,
          action: "sandbox_delete",
          resourceType: "sandbox",
          resourceId: sandboxId,
          metadata: {
            reason: "user",
            source: "sandboxes-api",
          },
        })
        return json({ data: { success: true, action: "delete" } })

      case "preview": {
        const port = (body.port as number) || 3000
        const url = await getSandboxPreviewUrl(sandboxId, port)
        return json({ data: { url } })
      }

      case "desktop": {
        const { url, token } = await getDesktopUrl(sandboxId)
        return json({ data: { url, token } })
      }

      case "web-terminal": {
        const { url, token } = await getWebTerminalUrl(sandboxId)
        return json({ data: { url, token } })
      }

      default:
        return json(
          {
            error: {
              code: "validation_error",
              message: `Unknown action: ${action}`,
            },
          },
          { status: 400 }
        )
    }
  } catch (error) {
    return handleRouteError(error)
  }
}
