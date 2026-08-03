import { prisma as db } from "@/lib/db";
import {
  createSandbox,
  getSandboxPreviewUrl,
  getWebTerminalUrl,
  deleteSandbox,
} from "@/lib/daytona";
import type { AgentSession, ProposalRiskLevel } from "@prisma/client";

export interface InitiateCodingTaskInput {
  organizationId: string;
  projectId: string;
  sessionName?: string;
  prompt: string;
  repositoryId?: string;
  branchName?: string;
}

export class CodingAgentService {
  /**
   * Initiate an autonomous coding agent task.
   * Creates an AgentSession record, provisions a Daytona cloud sandbox,
   * and builds project context for subagent execution.
   */
  static async initiateTask(input: InitiateCodingTaskInput): Promise<{
    session: AgentSession;
    sandboxId: string;
    previewUrl?: string;
    terminalUrl?: string;
  }> {
    // 1. Fetch project (org-scoped) and optionally linked repository
    const project = await db.project.findFirst({
      where: { id: input.projectId, organizationId: input.organizationId },
      include: {
        repositories: true,
        files: true,
      },
    });

    if (!project) {
      throw new Error(`Project '${input.projectId}' not found`);
    }

    const linkedRepo = input.repositoryId
      ? project.repositories.find((r) => r.id === input.repositoryId)
      : project.repositories[0];

    // 2. Provision Daytona Cloud Sandbox
    const sandboxName = `coding-${project.slug}-${Date.now().toString(36)}`;
    const sandbox = await createSandbox(sandboxName, "typescript");

    let previewUrl: string | undefined;
    let terminalUrl: string | undefined;
    try {
      previewUrl = await getSandboxPreviewUrl(sandbox.id, 3000);
      const term = await getWebTerminalUrl(sandbox.id);
      terminalUrl = term.url;
    } catch (err) {
      console.warn("[CodingAgentService] Preview URL fallback:", err);
    }

    // 3. Create AgentSession record — destroy the sandbox if this fails so a
    // paid sandbox never leaks on partial provisioning.
    let session: AgentSession;
    try {
      session = await db.agentSession.create({
        data: {
          projectId: input.projectId,
          name: input.sessionName || `Coding Task: ${input.prompt.slice(0, 40)}...`,
          type: "coding",
          status: "running",
          prompt: input.prompt,
          daytonaSandboxId: sandbox.id,
          sandboxUrl: previewUrl,
          currentTask: input.prompt,
          metadata: {
            repositoryUrl: linkedRepo?.url,
            branchName: input.branchName || linkedRepo?.branch || "main",
            terminalUrl,
            filesCount: project.files.length,
          },
        },
      });
    } catch (err) {
      try {
        await deleteSandbox(sandbox.id);
      } catch {
        // ignore cleanup failure; the original error is more useful
      }
      throw err;
    }

    return {
      session,
      sandboxId: sandbox.id,
      previewUrl,
      terminalUrl,
    };
  }

  /**
   * Create a Human-In-The-Loop action proposal for high-risk coding agent actions
   * (e.g. pushing to git, creating PR, deploying).
   */
  static async proposeCodeAction(input: {
    projectId: string;
    agentSessionId: string;
    createdById?: string;
    title: string;
    description: string;
    actionType: "git_push" | "create_pr" | "trigger_deploy";
    riskLevel?: ProposalRiskLevel;
    payload: Record<string, unknown>;
  }) {
    return db.actionProposal.create({
      data: {
        projectId: input.projectId,
        agentSessionId: input.agentSessionId,
        createdById: input.createdById,
        title: input.title,
        description: input.description,
        riskLevel: input.riskLevel || "high",
        actionType: input.actionType,
        targetSystem: input.actionType === "trigger_deploy" ? "vercel" : "github",
        status: "awaiting_approval",
        payload: input.payload as any,
      },
    });
  }

  /**
   * List coding agent sessions for a project (org-scoped)
   */
  static async listSessions(
    projectId: string,
    organizationId: string
  ): Promise<AgentSession[]> {
    return db.agentSession.findMany({
      where: {
        projectId,
        type: "coding",
        project: { organizationId },
      },
      orderBy: { createdAt: "desc" },
      include: {
        proposals: true,
      },
    });
  }
}
