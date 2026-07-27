import { handleRouteError, json } from "@/lib/api/http"
import {
  getSandbox,
  stopSandbox,
  startSandbox,
  deleteSandbox,
  getSandboxPreviewUrl,
} from "@/lib/daytona"

// ---------------------------------------------------------------------------
// GET /api/agents/sandboxes/:sandboxId — Get a single sandbox
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  try {
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
    const body = await request.json()
    const action = body.action as string | undefined

    if (!action || !["stop", "start", "delete", "preview"].includes(action)) {
      return json(
        {
          error: {
            code: "validation_error",
            message:
              "A valid action is required: 'stop', 'start', 'delete', or 'preview'.",
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
        return json({ data: { success: true, action: "delete" } })

      case "preview": {
        const port = (body.port as number) || 3000
        const url = await getSandboxPreviewUrl(sandboxId, port)
        return json({ data: { url } })
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
