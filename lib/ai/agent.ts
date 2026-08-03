import { ToolLoopAgent, tool, isStepCount } from "ai";
import { z } from "zod";
import { getModel, SYSTEM_PROMPTS, type SystemPromptKey } from "./config";
import type { AgentType, User } from "@prisma/client";
import { workspaceTools } from "./tools";
import { canAgentUseTool } from "./tool-access";
import { canAgentUseTool } from "./tool-access";

// ─── Workspace Context Schema ────────────────────────────────────────────────

export const WorkspaceContextSchema = z.object({
  userId: z.string(),
  organizationId: z.string(),
  projectId: z.string().optional(),
  environmentId: z.string().optional(),
});

export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>;

// ─── Runtime Context (flows through agent loop) ──────────────────────────────

export interface AgentRuntimeContext {
  requestId: string;
  workspaceContext: WorkspaceContext;
  user: Pick<User, "id" | "name" | "email">;
  timestamp: string;
}

// ─── Agent Factory ───────────────────────────────────────────────────────────

/**
 * Create a type-aware agent instance.
 * When agentType matches a system prompt key, the agent gets
 * persona-specific instructions; otherwise falls back to the
 * general secretsManager prompt.
 */
const AGENT_TYPES: AgentType[] = ["coding", "content", "ops", "research"];

export function createAgent(agentType?: string) {
  const promptKey: SystemPromptKey =
    agentType && agentType in SYSTEM_PROMPTS
      ? (agentType as SystemPromptKey)
      : "secretsManager";

  const agentTypeKey =
    agentType && (AGENT_TYPES as string[]).includes(agentType)
      ? (agentType as AgentType)
      : undefined;

  const tools = agentTypeKey
    ? Object.fromEntries(
        Object.entries(workspaceTools).filter(([name]) =>
          canAgentUseTool(agentTypeKey, name)
        )
      )
    : workspaceTools;

  return new ToolLoopAgent({
    model: getModel("openrouter", "openrouter/free"),
    instructions: SYSTEM_PROMPTS[promptKey],
    tools,
    // Allow up to 30 steps for complex multi-tool workflows
    stopWhen: isStepCount(30),
  } as any);
}

// ─── Base Agent Definition (fallback) ────────────────────────────────────────

/**
 * Flowspace Base Agent
 * 
 * The core AI agent for Flowspace workspace with workspace-aware tools.
 * Can retrieve secrets, documents, tasks, and create new resources.
 * 
 * Tools are modular and defined in ./tools/ directory.
 */
export const nimbusBaseAgent = createAgent();

// ─── Type exports for frontend ───────────────────────────────────────────────

export type { InferAgentUIMessage as NimbusAgentMessage } from "ai";
