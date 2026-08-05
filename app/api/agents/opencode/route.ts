import { handleRouteError, json } from "@/lib/api/http";
import { requireAuth, requireOrganization, requirePermission } from "@/lib/api/auth";
import { badRequest, notFound, forbidden } from "@/lib/api/errors";
import { OpencodeService } from "@/lib/services/opencode-service";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const startSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  sessionName: z.string().optional(),
  prompt: z.string().optional(),
  envVars: z.record(z.string(), z.string()).optional(),
});

/**
 * POST /api/agents/opencode
 * Provision a Daytona sandbox and start an OpenCode server inside it.
 * Returns the preview URLs the frontend connects to (HTTP + SSE).
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    const orgCtx = await requireOrganization(auth);

    const body = await request.json();
    const parsed = startSchema.parse(body);

    // Org-scope the project before a paid sandbox is provisioned.
    const project = await db.project.findFirst({
      where: { id: parsed.projectId, organizationId: orgCtx.organizationId },
      select: { id: true },
    });
    if (!project) {
      throw notFound("Project not found");
    }
    requirePermission(orgCtx.memberRole, "project:write");

    const result = await OpencodeService.start({
      organizationId: orgCtx.organizationId,
      projectId: parsed.projectId,
      sessionName: parsed.sessionName,
      prompt: parsed.prompt,
      envVars: parsed.envVars,
    });

    return json(
      {
        data: {
          sessionId: result.session.id,
          sandboxId: result.sandboxId,
          processSessionId: result.processSessionId,
          port: result.port,
          opencodeUrl: result.opencodeUrl,
          signedUrl: result.signedUrl,
          expiresIn: result.expiresIn,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * GET /api/agents/opencode?projectId=xxx
 * List OpenCode (coding) sessions for a project.
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

    const project = await db.project.findFirst({
      where: { id: projectId, organizationId: orgCtx.organizationId },
      select: { id: true },
    });
    if (!project) {
      throw notFound("Project not found");
    }
    requirePermission(orgCtx.memberRole, "project:read");

    const sessions = await OpencodeService.listSessions(projectId, orgCtx.organizationId);
    return json({ data: sessions });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/agents/opencode?projectId=xxx&sandboxId=yyy
 * Stop an OpenCode session (destroys the sandbox).
 */
export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    const orgCtx = await requireOrganization(auth);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const sandboxId = searchParams.get("sandboxId");
    if (!projectId || !sandboxId) {
      throw badRequest("projectId and sandboxId query parameters are required");
    }

    // Org-scope: the session must belong to the caller's org.
    const session = await db.agentSession.findFirst({
      where: {
        daytonaSandboxId: sandboxId,
        project: { id: projectId, organizationId: orgCtx.organizationId },
      },
      select: { id: true },
    });
    if (!session) {
      throw forbidden("Session not found in this organization");
    }
    requirePermission(orgCtx.memberRole, "project:write");

    const stopped = await OpencodeService.stop(sandboxId);
    return json({ data: { stopped: Boolean(stopped) } });
  } catch (error) {
    return handleRouteError(error);
  }
}
