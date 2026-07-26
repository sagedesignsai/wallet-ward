import { handleRouteError, json } from "@/lib/api/http";
import { listSandboxes, createSandbox } from "@/lib/daytona";

// ---------------------------------------------------------------------------
// GET /api/agents/sandboxes — List all sandboxes
// ---------------------------------------------------------------------------

export async function GET() {
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
        { status: 503 },
      );
    }

    const sandboxes = await listSandboxes();
    return json({ data: sandboxes });
  } catch (error) {
    return handleRouteError(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/agents/sandboxes — Create a new sandbox
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
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
        { status: 503 },
      );
    }

    const body = await request.json();
    const name = body.name as string | undefined;
    const language = body.language as string | undefined;

    if (!name) {
      return json(
        {
          error: {
            code: "validation_error",
            message: "A sandbox name is required.",
          },
        },
        { status: 400 },
      );
    }

    const sandbox = await createSandbox(name, language);
    return json({ data: sandbox }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
