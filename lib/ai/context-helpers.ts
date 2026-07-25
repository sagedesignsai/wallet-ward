import type { Session, User } from "@/generated/prisma/client";
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
export function buildToolsContext(organizationId: string, userId: string) {
  return {
    getSecrets: {
      organizationId,
    },
    getDocuments: {
      organizationId,
    },
    createDocument: {
      userId,
      organizationId,
    },
    getTasks: {
      organizationId,
    },
    createTask: {
      organizationId,
    },
    getProjects: {
      organizationId,
    },
    searchAuditLogs: {
      organizationId,
    },
  };
}
