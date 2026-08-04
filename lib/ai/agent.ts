import { ToolLoopAgent } from "ai"
import { createCodingAgent } from "./agents/coding-agent"
import { createOpsAgent } from "./agents/ops-agent"
import { createContentAgent } from "./agents/content-agent"
import { createResearchAgent } from "./agents/research-agent"
import { createOrchestrator } from "./agents/orchestrator"
import type {
  AgentRuntimeContext,
  CodingAgentContext,
  OpsAgentContext,
  ContentAgentContext,
  ResearchAgentContext,
  OrchestratorContext,
} from "./context-builders"

// ─── Agent factory ────────────────────────────────────────────────────────────

/**
 * Union of every agent's toolsContext shape, so the route can build one
 * context map per request and dispatch it to the correct agent constructor.
 */
export type AgentFactoryOptions = {
  toolsContext:
    | CodingAgentContext
    | OpsAgentContext
    | ContentAgentContext
    | ResearchAgentContext
    | OrchestratorContext
  runtimeContext?: AgentRuntimeContext
}

/**
 * Returns the correct specialist agent for the given agentType, or the
 * orchestrator when no type is specified (free-form chat).
 *
 * toolsContext and runtimeContext are constructor options in AI SDK v7 and
 * are forwarded to the selected agent. The chat route builds the per-tool
 * context map via buildAgentContext() and passes it here.
 */
export function createAgent(
  agentType?: string,
  options?: AgentFactoryOptions
): ToolLoopAgent<never, any> {
  switch (agentType) {
    case "coding":
      return createCodingAgent({
        toolsContext: options?.toolsContext as CodingAgentContext,
        runtimeContext: options?.runtimeContext,
      })
    case "ops":
      return createOpsAgent({
        toolsContext: options?.toolsContext as OpsAgentContext,
        runtimeContext: options?.runtimeContext,
      })
    case "content":
      return createContentAgent({
        toolsContext: options?.toolsContext as ContentAgentContext,
        runtimeContext: options?.runtimeContext,
      })
    case "research":
      return createResearchAgent({
        toolsContext: options?.toolsContext as ResearchAgentContext,
        runtimeContext: options?.runtimeContext,
      })
    default:
      return createOrchestrator({
        toolsContext: options?.toolsContext as OrchestratorContext,
        runtimeContext: options?.runtimeContext,
      })
  }
}

// ─── Type exports ─────────────────────────────────────────────────────────────

export type { InferAgentUIMessage as NimbusAgentMessage } from "ai"
