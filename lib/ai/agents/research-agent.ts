import { ToolLoopAgent, isStepCount } from "ai"
import { getModel, SYSTEM_PROMPTS } from "@/lib/ai/config"
import type {
  ResearchAgentContext,
  AgentRuntimeContext,
} from "@/lib/ai/context-builders"
import { telemetryFromRuntimeContext, wrapAgentTools } from "@/lib/ai/telemetry"

// Read-only content tools
import { getDocumentsTool } from "@/lib/ai/tools/content/get-documents"

// Read-only ops tools
import { getTasksTool } from "@/lib/ai/tools/ops/get-tasks"
import { searchAuditLogsTool } from "@/lib/ai/tools/ops/search-audit-logs"

// Shared tools (read-only subset — no secrets, no agentProxy)
import { getProjectsTool } from "@/lib/ai/tools/shared/get-projects"
import { getRepositoriesTool } from "@/lib/ai/tools/shared/get-repositories"
import { getProjectFilesTool } from "@/lib/ai/tools/shared/get-project-files"
import { createArtifactTool } from "@/lib/ai/tools/shared/create-artifact"
import { proposeActionTool } from "@/lib/ai/tools/shared/propose-action"
import { getPendingProposalsTool } from "@/lib/ai/tools/shared/get-pending-proposals"

export const researchAgentTools = {
  getDocuments: getDocumentsTool,
  getTasks: getTasksTool,
  searchAuditLogs: searchAuditLogsTool,
  getProjects: getProjectsTool,
  getRepositories: getRepositoriesTool,
  getProjectFiles: getProjectFilesTool,
  createArtifact: createArtifactTool,
  proposeAction: proposeActionTool,
  getPendingProposals: getPendingProposalsTool,
} as const

/**
 * Options for constructing a research agent.
 * toolsContext is required — every tool in the set declares a contextSchema.
 */
export interface ResearchAgentOptions {
  toolsContext: ResearchAgentContext
  runtimeContext?: AgentRuntimeContext
}

/**
 * Research Agent
 *
 * Read-only analyst. Gathers intelligence and synthesizes information from
 * documents, tasks, and audit logs. Cannot execute code, deploy, access
 * secrets, or make external API calls — purely analytical.
 *
 * The one mutation it may perform is `createArtifact`, used to persist a
 * research report / executive summary to project storage (org-scoped, gated
 * by `proposeAction` for anything risky). All other capabilities are read-only.
 */
export function createResearchAgent(options: ResearchAgentOptions) {
  const telemetry = telemetryFromRuntimeContext(options.runtimeContext)
  return new ToolLoopAgent({
    model: getModel("openrouter", "openrouter/free"),
    instructions: SYSTEM_PROMPTS.research,
    tools: telemetry
      ? wrapAgentTools(researchAgentTools, telemetry)
      : researchAgentTools,
    toolsContext: options.toolsContext,
    runtimeContext: options.runtimeContext,
    stopWhen: isStepCount(20),
  })
}

export type ResearchAgent = ReturnType<typeof createResearchAgent>
