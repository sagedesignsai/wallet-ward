import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  UIMessage,
  convertToModelMessages,
  APICallError,
  RetryError,
} from "ai"
import { createAgent } from "@/lib/ai/agent"
import { buildRuntimeContext, buildAgentContext } from "@/lib/ai/context-builders"
import { requireAuth } from "@/lib/api/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * AI Chat API Route
 *
 * Handles streaming chat requests with the Flowspace AI agent system.
 *
 * Architecture:
 *   - agentType provided → specialist agent (coding/ops/content/research)
 *   - agentType omitted  → orchestrator (routes to specialist via delegateToAgent tool)
 *
 * Context flow (AI SDK v7):
 *   - runtimeContext: shared loop state (requestId, org, user, timestamp)
 *   - toolsContext:   per-tool values keyed by tool name, typed to each tool's contextSchema
 */
export async function POST(request: Request) {
  try {
    const authContext = await requireAuth()

    const body = await request.json()
    const { messages, projectId, environmentId, agentType, sessionId } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 })
    }

    if (!authContext.organizationId) {
      return Response.json({ error: "No active organization" }, { status: 400 })
    }

    // Manage AgentSession persistence (best-effort, non-critical)
    let agentSessionId: string | undefined
    if (agentType && authContext.organizationId) {
      agentSessionId = await resolveAgentSession(
        sessionId,
        agentType,
        authContext.organizationId
      )
    }

    // Build shared runtime context (available in prepareStep + lifecycle callbacks)
    const runtimeContext = buildRuntimeContext(
      authContext.organizationId,
      authContext.userId,
      agentType
    )

    // Build per-tool context map (each tool receives only its own typed slice)
    const toolsContext = buildAgentContext(
      agentType,
      authContext.organizationId,
      authContext.userId,
      { agentSessionId }
    )

    // Instantiate the correct agent — toolsContext and runtimeContext are
    // constructor options in AI SDK v7, so they are forwarded via createAgent()
    const agent = createAgent(agentType, { toolsContext, runtimeContext })

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages as UIMessage[])

    // Stream — agent handles the tool loop internally
    const result = await agent.stream({
      messages: modelMessages,
    })

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => {
          if (APICallError.isInstance(error)) {
            if (error.statusCode === 429) return "Rate limit reached. Please try again shortly."
            if (error.statusCode === 401) return "Invalid API key."
            if (error.statusCode === 403) return "Access denied to AI service."
            if (error.isRetryable) return "The AI service is temporarily unavailable."
            return "AI service error. Please try again."
          }
          if (RetryError.isInstance(error))
            return "Failed after multiple retries. Please try again."
          console.error("[AI Chat Stream Error]", error)
          return "Something went wrong. Please try again."
        },
      }),
      headers: agentSessionId
        ? { "X-Agent-Session-Id": agentSessionId, "X-Agent-Type": agentType }
        : undefined,
    })
  } catch (error) {
    console.error("[AI Chat Error]", error)

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (APICallError.isInstance(error)) {
      if (error.statusCode === 429)
        return Response.json({ error: "Rate limit reached. Please try again shortly." }, { status: 429 })
      if (error.statusCode === 401)
        return Response.json({ error: "Invalid API key." }, { status: 401 })
    }

    if (RetryError.isInstance(error)) {
      return Response.json({ error: "AI service temporarily unavailable." }, { status: 503 })
    }

    return Response.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}

// ─── Session helper ───────────────────────────────────────────────────────────

async function resolveAgentSession(
  sessionId: string | undefined,
  agentType: string,
  organizationId: string
): Promise<string | undefined> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    if (sessionId) {
      await fetch(`${appUrl}/api/agents/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "running" }),
      })
      return sessionId
    }

    const project = await prisma.project.findFirst({
      where: { organizationId },
      select: { id: true },
    })
    if (!project) return undefined

    const res = await fetch(`${appUrl}/api/agents/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        name: `${agentType} agent session`,
        type: agentType,
      }),
    })
    const data = await res.json()
    return data.data?.id
  } catch (err) {
    console.warn("[AI Chat] Failed to create/update agent session:", err)
    return undefined
  }
}
