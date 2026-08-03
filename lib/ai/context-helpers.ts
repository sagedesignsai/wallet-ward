import type { Session, User } from "@prisma/client";
import type { AgentRuntimeContext, WorkspaceContext } from "./agent";

/**
 * Build workspace context from session and optional parameters
 */
export function buildWorkspaceContext(
  session: Session & { user?: User | null },
  options?: {
    projectId?: string;
    environmentId?: string;
  }
): WorkspaceContext {
  if (!session.activeOrganizationId) {
    throw new Error("No active organization found in session");
  }

  if (!session.user) {
    throw new Error("User not found in session");
  }

  return {
    userId: session.user.id,
    organizationId: session.activeOrganizationId,
    projectId: options?.projectId,
    environmentId: options?.environmentId,
  };
}

/**
 * Build complete agent runtime context
 */
export function buildAgentRuntimeContext(
  user: Pick<User, "id" | "name" | "email">,
  workspaceContext: WorkspaceContext,
  requestId: string
): AgentRuntimeContext {
  return {
    requestId,
    workspaceContext,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build tools context for the agent
 * This maps each tool to its required context values
 */
export function buildToolsContext(
  organizationId: string,
  userId: string,
  options?: {
    projectId?: string;
    environmentId?: string;
    agentType?: string;
  }
) {
  return {
    getSecrets: {
      organizationId,
      projectId: options?.projectId,
    },
    getDocuments: {
      organizationId,
      projectId: options?.projectId,
    },
    createDocument: {
      userId,
      organizationId,
      projectId: options?.projectId,
    },
    getTasks: {
      organizationId,
      projectId: options?.projectId,
    },
    createTask: {
      organizationId,
      projectId: options?.projectId,
    },
    getProjects: {
      organizationId,
    },
    searchAuditLogs: {
      organizationId,
      projectId: options?.projectId,
    },
    proposeAction: {
      organizationId,
      userId,
      projectId: options?.projectId,
    },
    createSandbox: {
      organizationId,
      projectId: options?.projectId,
    },
    executeCommand: {
      organizationId,
      projectId: options?.projectId,
    },
    agentProxy: {
      organizationId,
      projectId: options?.projectId,
      agentType: options?.agentType,
    },
    getRepositories: {
      organizationId,
      projectId: options?.projectId,
    },
    getProjectFiles: {
      organizationId,
      projectId: options?.projectId,
    },
    cloneRepository: {
      organizationId,
      projectId: options?.projectId,
    },
    opencodeSubagent: {
      organizationId,
      projectId: options?.projectId,
    },
    getSandboxPreview: {
      organizationId,
    },
    createGithubPullRequest: {
      organizationId,
    },
    triggerVercelDeploy: {
      organizationId,
      agentType: options?.agentType,
    },
    sendSlackNotification: {
      organizationId,
    },
    sendEmail: {
      organizationId,
    },
    getPendingProposals: {
      organizationId,
    },
    startDesktop: {
      organizationId,
      agentType: options?.agentType,
    },
    stopDesktop: {
      organizationId,
      agentType: options?.agentType,
    },
    computerUse: {
      organizationId,
      agentType: options?.agentType,
    },
    getWebTerminalUrl: {
      organizationId,
      agentType: options?.agentType,
    },
    listSandboxFiles: {
      organizationId,
      agentType: options?.agentType,
    },
    readSandboxFile: {
      organizationId,
      agentType: options?.agentType,
    },
  };
}
