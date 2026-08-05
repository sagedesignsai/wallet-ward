import {
  ToolLoopAgent,
  isStepCount,
  tool,
  readUIMessageStream,
  toUIMessageStream,
} from "ai"
import { z } from "zod"
import { getModel, SYSTEM_PROMPTS } from "@/lib/ai/config"
import {
  buildCodingAgentContext,
  buildOpsAgentContext,
  buildContentAgentContext,
  buildResearchAgentContext,
  buildRuntimeContext,
  type AgentRuntimeContext,
  type OrchestratorContext,
} from "@/lib/ai/context-builders"
import { getProjectsTool } from "@/lib/ai/tools/shared/get-projects"
import { proposeActionTool } from "@/lib/ai/tools/shared/propose-action"
import { getPendingProposalsTool } from "@/lib/ai/tools/shared/get-pending-proposals"
import { createCodingAgent } from "./coding-agent"
import { createOpsAgent } from "./ops-agent"
import { createContentAgent } from "./content-agent"
import { createResearchAgent } from "./research-agent"

// ─── Specialist factories ───────────────────────────────────────────────────

const SPECIALIST_FACTORIES = {
  coding: createCodingAgent,
  ops: createOpsAgent,
  content: createContentAgent,
  research: createResearchAgent,
} as const

export type DelegateAgentType = keyof typeof SPECIALIST_FACTORIES

// ─── Delegation tool ──────────────────────────────────────────────────────

/**
 * delegateToAgent — the orchestrator's primary tool.
 *
 * Uses the AI SDK streaming subagent pattern:
 *  - Streams subagent progress to the UI via preliminary tool results
 *  - toModelOutput() ensures the orchestrator model only sees the final summary,
 *    not the full subagent execution history
 */
const delegateToAgentTool = tool({
  description: `Delegate a task to the most appropriate specialist agent:
- coding: build, test, deploy code in Daytona sandboxes; GitHub PRs; computer use
- ops: task management, deployments, Slack/Vercel notifications, audit monitoring
- content: documents, emails, Notion, Airtable, Jira, Trello
- research: read-only analysis of documents, tasks, audit logs, repositories`,
  inputSchema: z.object({
    agentType: z
      .enum(["coding", "ops", "content", "research"])
      .describe("The specialist agent type best suited for this task"),
    task: z
      .string()
      .describe(
        "Clear, complete description of the task for the specialist agent"
      ),
    projectId: z
      .string()
      .optional()
      .describe("Project context to pass to the specialist"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    userId: z.string(),
    agentSessionId: z.string().optional(),
    projectId: z.string().optional(),
  }),
  execute: async function* ({ agentType, task, projectId }, { context, abortSignal }) {
    // Build the specialist with its own org-scoped toolsContext.
    // The orchestrator's toolsContext is not passed through — each specialist
    // requires a context map keyed to its own tool set.
    const specialist = createSpecialistAgent(agentType, {
      organizationId: context.organizationId,
      userId: context.userId,
      agentSessionId: context.agentSessionId,
      projectId: context.projectId ?? projectId,
    })

    // Build a context message including org and project scope
    const resolvedProjectId = context.projectId ?? projectId
    const contextNote = [
      `Organization ID: ${context.organizationId}`,
      resolvedProjectId ? `Project ID: ${resolvedProjectId}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    const fullTask = `${task}\n\n---\n${contextNote}`

    // Stream the subagent and yield progress as preliminary UIMessages.
    // The UI gets the full execution; the orchestrator model only sees the summary.
    const result = await specialist.stream({
      prompt: fullTask,
      abortSignal,
    })

    for await (const message of readUIMessageStream({
      stream: toUIMessageStream({ stream: result.stream }),
    })) {
      yield message
    }
  },
  // What the orchestrator model sees after delegation completes:
  // just the final text summary, not the full subagent history.
  toModelOutput: ({ output: message }) => {
    const lastText = message?.parts?.findLast(
      (p: { type: string }) => p.type === "text"
    ) as { text: string } | undefined
    return {
      type: "text" as const,
      value: lastText?.text ?? "Task delegated and completed.",
    }
  },
})

// ─── Specialist construction ────────────────────────────────────────────────

/**
 * Constructs a specialist agent with a freshly built, org-scoped toolsContext.
 * The runtimeContext is also rebuilt so the specialist has its own agentType.
 */
function createSpecialistAgent(
  agentType: DelegateAgentType,
  ctx: { organizationId: string; userId: string; agentSessionId?: string; projectId?: string }
): ToolLoopAgent<never, any> {
  const runtimeContext: AgentRuntimeContext = buildRuntimeContext(
    ctx.organizationId,
    ctx.userId,
    agentType,
    ctx.projectId
  )
  const session = {
    agentSessionId: ctx.agentSessionId,
    projectId: ctx.projectId,
  }

  switch (agentType) {
    case "coding":
      return createCodingAgent({
        toolsContext: buildCodingAgentContext(ctx.organizationId, ctx.userId, session),
        runtimeContext,
      })
    case "ops":
      return createOpsAgent({
        toolsContext: buildOpsAgentContext(ctx.organizationId, ctx.userId, session),
        runtimeContext,
      })
    case "content":
      return createContentAgent({
        toolsContext: buildContentAgentContext(ctx.organizationId, ctx.userId, session),
        runtimeContext,
      })
    case "research":
      return createResearchAgent({
        toolsContext: buildResearchAgentContext(ctx.organizationId, ctx.userId, session),
        runtimeContext,
      })
  }
}

// ─── Orchestrator agent ───────────────────────────────────────────────────

const ORCHESTRATOR_INSTRUCTIONS = `You are the Flowspace Orchestrator — a routing agent that delegates work to specialist sub-agents.

Your only job is to understand the user's intent and route it to the correct specialist:
- coding: anything involving code, sandboxes, git, deployment pipelines, or computer use
- ops: task management, operational workflows, Slack notifications, audit log monitoring
- content: writing documents, sending emails, creating records in Notion/Airtable/Jira/Trello
- research: analysis, synthesis, read-only research across documents, tasks, and audit logs

ROUTING RULES:
1. Always delegate using the delegateToAgent tool — do not attempt tasks yourself
2. For ambiguous requests, pick the most likely specialist and explain your choice
3. Include all necessary context in the task description so the specialist can work autonomously
4. After delegation, report the specialist's result to the user clearly

If the user is already in a specialist agent session (agentType is set in the route body),
this orchestrator is bypassed entirely — specialist agents handle requests directly.`

/**
 * Options for constructing the orchestrator.
 * toolsContext is required — every tool in the set declares a contextSchema.
 */
export interface OrchestratorOptions {
  toolsContext: OrchestratorContext
  runtimeContext?: AgentRuntimeContext
}

export function createOrchestrator(options: OrchestratorOptions) {
  return new ToolLoopAgent({
    model: getModel("openrouter", "openrouter/free"),
    instructions: ORCHESTRATOR_INSTRUCTIONS,
    tools: {
      delegateToAgent: delegateToAgentTool,
      getProjects: getProjectsTool,
      proposeAction: proposeActionTool,
      getPendingProposals: getPendingProposalsTool,
    },
    toolsContext: options.toolsContext,
    runtimeContext: options.runtimeContext,
    stopWhen: isStepCount(10),
  })
}

export type Orchestrator = ReturnType<typeof createOrchestrator>
