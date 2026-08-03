import { handleRouteError, json } from "@/lib/api/http";
import { requireAuth, requireOrganization, requirePermission } from "@/lib/api/auth";
import { forbidden, badRequest, notFound } from "@/lib/api/errors";
import { CodingAgentService } from "@/lib/services/coding-agent-service";
import { prisma as db } from "@/lib/db";
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
    const orgCtx = await requireOrganization(auth);

    const body = await request.json();
    const parsed = initTaskSchema.parse(body);

    // Org-scope the project: the caller must belong to the project's org
    // and hold project:write before a paid sandbox is provisioned.
    const project = await db.project.findFirst({
      where: { id: parsed.projectId, organizationId: orgCtx.organizationId },
      select: { id: true },
    });
    if (!project) {
      throw notFound("Project not found");
    }
    requirePermission(orgCtx.memberRole, "project:write");

    const result = await CodingAgentService.initiateTask({
      projectId: parsed.projectId,
      organizationId: orgCtx.organizationId,
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
    const orgCtx = await requireOrganization(auth);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      throw badRequest("Missing projectId query parameter");
    }

    // Org-scope the project before listing its coding sessions.
    const project = await db.project.findFirst({
      where: { id: projectId, organizationId: orgCtx.organizationId },
      select: { id: true },
    });
    if (!project) {
      throw notFound("Project not found");
    }
    requirePermission(orgCtx.memberRole, "project:read");

    const sessions = await CodingAgentService.listSessions(
      projectId,
      orgCtx.organizationId
    );
    return json({ data: sessions });
  } catch (error) {
    return handleRouteError(error);
  }
}
