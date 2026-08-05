/**
 * Per-agent typed context builders
 *
 * Each builder produces the exact toolsContext shape required by that agent's
 * tool set. runtimeContext carries shared agent-loop state (requestId, org,
 * user) and is passed separately to agent.stream().
 *
 * AI SDK v7 semantics:
 *   - runtimeContext  → shared loop state, available in prepareStep + callbacks
 *   - toolsContext    → per-tool values validated against each tool's contextSchema
 */

// ─── Runtime context (shared across all agents) ──────────────────────────────

export interface AgentRuntimeContext {
  requestId: string
  organizationId: string
  userId: string
  agentType?: string
  projectId?: string
  timestamp: string
}

export function buildRuntimeContext(
  organizationId: string,
  userId: string,
  agentType?: string,
  projectId?: string
): AgentRuntimeContext {
  return {
    requestId: crypto.randomUUID(),
    organizationId,
    userId,
    agentType,
    projectId,
    timestamp: new Date().toISOString(),
  }
}

// ─── Shared context values (used by multiple agents) ─────────────────────────

interface SharedContext {
  organizationId: string
  projectId?: string
}

interface SharedWithUserContext {
  organizationId: string
  userId: string
  agentSessionId?: string
  projectId?: string
}

// ─── Coding agent context ─────────────────────────────────────────────────────

export function buildCodingAgentContext(
  organizationId: string,
  userId: string,
  options?: { projectId?: string; agentSessionId?: string }
) {
  const shared: SharedContext = { organizationId, projectId: options?.projectId }
  const sharedWithUser: SharedWithUserContext = {
    organizationId,
    userId,
    agentSessionId: options?.agentSessionId,
    projectId: options?.projectId,
  }

  return {
    // Sandbox tools
    createSandbox: shared,
    executeCommand: shared,
    getSandboxPreview: shared,
    cloneRepository: shared,
    startDesktop: shared,
    stopDesktop: shared,
    computerUse: shared,
    getWebTerminalUrl: shared,
    listSandboxFiles: shared,
    readSandboxFile: shared,
    opencodeSubagent: shared,
    // Ops tools
    createGithubPullRequest: shared,
    triggerVercelDeploy: shared,
    sendSlackNotification: shared,
    // Shared tools
    getProjects: shared,
    getRepositories: shared,
    getProjectFiles: shared,
    getSecrets: shared,
    agentProxy: shared,
    proposeAction: sharedWithUser,
    getPendingProposals: shared,
  }
}

export type CodingAgentContext = ReturnType<typeof buildCodingAgentContext>

// ─── Ops agent context ────────────────────────────────────────────────────────

export function buildOpsAgentContext(
  organizationId: string,
  userId: string,
  options?: { projectId?: string; agentSessionId?: string }
) {
  const shared: SharedContext = { organizationId, projectId: options?.projectId }
  const sharedWithUser: SharedWithUserContext = {
    organizationId,
    userId,
    agentSessionId: options?.agentSessionId,
    projectId: options?.projectId,
  }

  return {
    getTasks: shared,
    createTask: shared,
    searchAuditLogs: shared,
    triggerVercelDeploy: shared,
    createGithubPullRequest: shared,
    sendSlackNotification: shared,
    getWebTerminalUrl: shared,
    getProjects: shared,
    getRepositories: shared,
    getProjectFiles: shared,
    getSecrets: shared,
    agentProxy: shared,
    proposeAction: sharedWithUser,
    getPendingProposals: shared,
  }
}

export type OpsAgentContext = ReturnType<typeof buildOpsAgentContext>

// ─── Content agent context ────────────────────────────────────────────────────

export function buildContentAgentContext(
  organizationId: string,
  userId: string,
  options?: { projectId?: string; agentSessionId?: string }
) {
  const shared: SharedContext = { organizationId, projectId: options?.projectId }
  const sharedWithUser: SharedWithUserContext = {
    organizationId,
    userId,
    agentSessionId: options?.agentSessionId,
    projectId: options?.projectId,
  }

  return {
    // createDocument needs userId for createdById
    createDocument: { organizationId, userId },
    getDocuments: shared,
    sendEmail: shared,
    airtableCreateRecord: shared,
    jiraCreateIssue: shared,
    notionCreatePage: shared,
    trelloCreateCard: shared,
    sendSlackNotification: shared,
    searchAuditLogs: shared,
    getProjects: shared,
    getRepositories: shared,
    getProjectFiles: shared,
    agentProxy: shared,
    proposeAction: sharedWithUser,
    getPendingProposals: shared,
  }
}

export type ContentAgentContext = ReturnType<typeof buildContentAgentContext>

// ─── Research agent context ───────────────────────────────────────────────────

export function buildResearchAgentContext(
  organizationId: string,
  userId: string,
  options?: { projectId?: string; agentSessionId?: string }
) {
  const shared: SharedContext = { organizationId, projectId: options?.projectId }
  const sharedWithUser: SharedWithUserContext = {
    organizationId,
    userId,
    agentSessionId: options?.agentSessionId,
    projectId: options?.projectId,
  }

  return {
    getDocuments: shared,
    getTasks: shared,
    searchAuditLogs: shared,
    getProjects: shared,
    getRepositories: shared,
    getProjectFiles: shared,
    proposeAction: sharedWithUser,
    getPendingProposals: shared,
  }
}

export type ResearchAgentContext = ReturnType<typeof buildResearchAgentContext>

// ─── Orchestrator context ─────────────────────────────────────────────────────

export function buildOrchestratorContext(
  organizationId: string,
  userId: string,
  options?: { projectId?: string; agentSessionId?: string }
) {
  const shared: SharedContext = { organizationId, projectId: options?.projectId }
  const sharedWithUser: SharedWithUserContext = {
    organizationId,
    userId,
    agentSessionId: options?.agentSessionId,
    projectId: options?.projectId,
  }

  return {
    delegateToAgent: sharedWithUser,
    getProjects: shared,
    proposeAction: sharedWithUser,
    getPendingProposals: shared,
  }
}

export type OrchestratorContext = ReturnType<typeof buildOrchestratorContext>

// ─── Generic factory ──────────────────────────────────────────────────────────

/**
 * Build the correct toolsContext for the given agentType.
 * Used by the chat route to avoid a switch statement.
 */
export function buildAgentContext(
  agentType: string | undefined,
  organizationId: string,
  userId: string,
  options?: { projectId?: string; agentSessionId?: string }
) {
  switch (agentType) {
    case "coding":
      return buildCodingAgentContext(organizationId, userId, options)
    case "ops":
      return buildOpsAgentContext(organizationId, userId, options)
    case "content":
      return buildContentAgentContext(organizationId, userId, options)
    case "research":
      return buildResearchAgentContext(organizationId, userId, options)
    default:
      return buildOrchestratorContext(organizationId, userId, options)
  }
}
