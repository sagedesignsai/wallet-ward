import { ToolLoopAgent, isStepCount } from "ai"
import { getModel, SYSTEM_PROMPTS } from "@/lib/ai/config"
import type {
  OpsAgentContext,
  AgentRuntimeContext,
} from "@/lib/ai/context-builders"

// Ops tools
import { getTasksTool } from "@/lib/ai/tools/ops/get-tasks"
import { createTaskTool } from "@/lib/ai/tools/ops/create-task"
import { searchAuditLogsTool } from "@/lib/ai/tools/ops/search-audit-logs"
import { triggerVercelDeployTool } from "@/lib/ai/tools/ops/trigger-vercel-deploy"
import { createGithubPullRequestTool } from "@/lib/ai/tools/ops/create-github-pr"
import { sendSlackNotificationTool } from "@/lib/ai/tools/ops/send-slack-notification"

// Sandbox tool ops also needs (web terminal access)
import { getWebTerminalUrlTool } from "@/lib/ai/tools/sandbox/get-web-terminal-url"

// Shared tools
import { getProjectsTool } from "@/lib/ai/tools/shared/get-projects"
import { getRepositoriesTool } from "@/lib/ai/tools/shared/get-repositories"
import { getProjectFilesTool } from "@/lib/ai/tools/shared/get-project-files"
import { getSecretsTool } from "@/lib/ai/tools/shared/get-secrets"
import { agentProxyTool } from "@/lib/ai/tools/shared/agent-proxy"
import { proposeActionTool } from "@/lib/ai/tools/shared/propose-action"
import { getPendingProposalsTool } from "@/lib/ai/tools/shared/get-pending-proposals"

export const opsAgentTools = {
  getTasks: getTasksTool,
  createTask: createTaskTool,
  searchAuditLogs: searchAuditLogsTool,
  triggerVercelDeploy: triggerVercelDeployTool,
  createGithubPullRequest: createGithubPullRequestTool,
  sendSlackNotification: sendSlackNotificationTool,
  getWebTerminalUrl: getWebTerminalUrlTool,
  getProjects: getProjectsTool,
  getRepositories: getRepositoriesTool,
  getProjectFiles: getProjectFilesTool,
  getSecrets: getSecretsTool,
  agentProxy: agentProxyTool,
  proposeAction: proposeActionTool,
  getPendingProposals: getPendingProposalsTool,
} as const

/**
 * Options for constructing an ops agent.
 * toolsContext is required — every tool in the set declares a contextSchema.
 */
export interface OpsAgentOptions {
  toolsContext: OpsAgentContext
  runtimeContext?: AgentRuntimeContext
}

/**
 * Ops Agent
 *
 * Autonomous operations manager: deployments, monitoring, task coordination,
 * notifications. Cannot execute arbitrary code or manage sandboxes.
 */
export function createOpsAgent(options: OpsAgentOptions) {
  return new ToolLoopAgent({
    model: getModel("openrouter", "openrouter/free"),
    instructions: SYSTEM_PROMPTS.ops,
    tools: opsAgentTools,
    toolsContext: options.toolsContext,
    runtimeContext: options.runtimeContext,
    stopWhen: isStepCount(20),
  })
}

export type OpsAgent = ReturnType<typeof createOpsAgent>
