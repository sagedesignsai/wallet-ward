import { ToolLoopAgent, tool, isStepCount } from "ai";
import { z } from "zod";
import { getModel, SYSTEM_PROMPTS } from "./config";
import type { User } from "@/generated/prisma/client";
import { workspaceTools } from "./tools";

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

// ─── Base Agent Definition ───────────────────────────────────────────────────

/**
 * Nimbus Base Agent
 * 
 * The core AI agent for Nimbus workspace with workspace-aware tools.
 * Can retrieve secrets, documents, tasks, and create new resources.
 * 
 * Tools are modular and defined in ./tools/ directory.
 */
export const nimbusBaseAgent = new ToolLoopAgent({
  model: getModel("openrouter", "openrouter/free"),
  instructions: SYSTEM_PROMPTS.secretsManager,
  tools: workspaceTools,
  // Allow up to 30 steps for complex multi-tool workflows
  stopWhen: isStepCount(30),
} as any);

// ─── Type exports for frontend ───────────────────────────────────────────────

export type { InferAgentUIMessage as NimbusAgentMessage } from "ai";
