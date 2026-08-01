import { handleRouteError, json } from "@/lib/api/http";
import { requireAuth } from "@/lib/api/auth";
import { forbidden, badRequest } from "@/lib/api/errors";
import { CodingAgentService } from "@/lib/services/coding-agent-service";
import { z } from "zod";

export const runtime = "nodejs";

const initTaskSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  prompt: z.string().min(1, "prompt is required"),
  sessionName: z.string().optional(),
  repositoryId: z.string().optional(),
  branchName: z.string().optional(),
});

/**
 * POST /api/agents/coding
 * Initiate an autonomous coding agent subagent task inside a Daytona Cloud Sandbox.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.organizationId) {
      throw forbidden("No active organization");
    }

    const body = await request.json();
    const parsed = initTaskSchema.parse(body);

    const result = await CodingAgentService.initiateTask({
      projectId: parsed.projectId,
      prompt: parsed.prompt,
      sessionName: parsed.sessionName,
      repositoryId: parsed.repositoryId,
      branchName: parsed.branchName,
    });

    return json({ data: result }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * GET /api/agents/coding?projectId=xxx
 * List coding agent sessions and proposals for a project.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.organizationId) {
      throw forbidden("No active organization");
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      throw badRequest("Missing projectId query parameter");
    }

    const sessions = await CodingAgentService.listSessions(projectId);
    return json({ data: sessions });
  } catch (error) {
    return handleRouteError(error);
  }
}
