import { ToolLoopAgent, isStepCount } from "ai"
import { getModel, SYSTEM_PROMPTS } from "@/lib/ai/config"
import type {
  CodingAgentContext,
  AgentRuntimeContext,
} from "@/lib/ai/context-builders"

// Sandbox tools
import { createSandboxTool } from "@/lib/ai/tools/sandbox/create-sandbox"
import { executeCommandTool } from "@/lib/ai/tools/sandbox/execute-command"
import { getSandboxPreviewTool } from "@/lib/ai/tools/sandbox/get-sandbox-preview"
import { cloneRepositoryTool } from "@/lib/ai/tools/sandbox/clone-repository"
import { startDesktopTool } from "@/lib/ai/tools/sandbox/start-desktop"
import { stopDesktopTool } from "@/lib/ai/tools/sandbox/stop-desktop"
import { computerUseTool } from "@/lib/ai/tools/sandbox/computer-use"
import { getWebTerminalUrlTool } from "@/lib/ai/tools/sandbox/get-web-terminal-url"
import { listSandboxFilesTool } from "@/lib/ai/tools/sandbox/list-sandbox-files"
import { readSandboxFileTool } from "@/lib/ai/tools/sandbox/read-sandbox-file"
import { opencodeSubagentTool } from "@/lib/ai/tools/sandbox/opencode-subagent"

// Ops tools coding also needs
import { createGithubPullRequestTool } from "@/lib/ai/tools/ops/create-github-pr"
import { triggerVercelDeployTool } from "@/lib/ai/tools/ops/trigger-vercel-deploy"
import { sendSlackNotificationTool } from "@/lib/ai/tools/ops/send-slack-notification"

// Shared tools
import { getProjectsTool } from "@/lib/ai/tools/shared/get-projects"
import { getRepositoriesTool } from "@/lib/ai/tools/shared/get-repositories"
import { getProjectFilesTool } from "@/lib/ai/tools/shared/get-project-files"
import { createArtifactTool } from "@/lib/ai/tools/shared/create-artifact"
import { getSecretsTool } from "@/lib/ai/tools/shared/get-secrets"
import { agentProxyTool } from "@/lib/ai/tools/shared/agent-proxy"
import { proposeActionTool } from "@/lib/ai/tools/shared/propose-action"
import { getPendingProposalsTool } from "@/lib/ai/tools/shared/get-pending-proposals"

/**
 * Tool set for the coding agent.
 * Exported so context builders can type against it.
 */
export const codingAgentTools = {
  createSandbox: createSandboxTool,
  executeCommand: executeCommandTool,
  getSandboxPreview: getSandboxPreviewTool,
  cloneRepository: cloneRepositoryTool,
  startDesktop: startDesktopTool,
  stopDesktop: stopDesktopTool,
  computerUse: computerUseTool,
  getWebTerminalUrl: getWebTerminalUrlTool,
  listSandboxFiles: listSandboxFilesTool,
  readSandboxFile: readSandboxFileTool,
  opencodeSubagent: opencodeSubagentTool,
  createGithubPullRequest: createGithubPullRequestTool,
  triggerVercelDeploy: triggerVercelDeployTool,
  sendSlackNotification: sendSlackNotificationTool,
  getProjects: getProjectsTool,
  getRepositories: getRepositoriesTool,
  getProjectFiles: getProjectFilesTool,
  createArtifact: createArtifactTool,
  getSecrets: getSecretsTool,
  agentProxy: agentProxyTool,
  proposeAction: proposeActionTool,
  getPendingProposals: getPendingProposalsTool,
} as const

/**
 * Options for constructing a coding agent.
 * toolsContext is required — every tool in the set declares a contextSchema,
 * so the SDK demands the full per-tool context map at construction time.
 */
export interface CodingAgentOptions {
  toolsContext: CodingAgentContext
  runtimeContext?: AgentRuntimeContext
}

/**
 * Coding Agent
 *
 * Autonomous developer that builds, tests, and deploys applications using
 * Daytona Cloud Sandboxes and the OpenCode subagent engine.
 * Preferred delegation pattern: use opencodeSubagent for multi-file tasks.
 */
export function createCodingAgent(options: CodingAgentOptions) {
  return new ToolLoopAgent({
    model: getModel("openrouter", "openrouter/free"),
    instructions: SYSTEM_PROMPTS.coding,
    tools: codingAgentTools,
    toolsContext: options.toolsContext,
    runtimeContext: options.runtimeContext,
    stopWhen: isStepCount(30),
  })
}

export type CodingAgent = ReturnType<typeof createCodingAgent>
