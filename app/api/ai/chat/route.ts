import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  UIMessage,
  convertToModelMessages,
  APICallError,
  RetryError,
} from "ai";
import { createAgent } from "@/lib/ai/agent";
import { buildToolsContext } from "@/lib/ai/context-helpers";
import { requireAuth } from "@/lib/api/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * AI Chat API Route
 * 
 * Handles streaming chat requests with the Flowspace AI agent.
 * Provides workspace-aware context to tools and maintains conversation history.
 * 
 * Uses createUIMessageStreamResponse to properly handle structured message parts
 * including tool invocations and results for rich UI rendering.
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const authContext = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const { messages, projectId, environmentId, agentType, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    if (!authContext.organizationId) {
      return Response.json({ error: "No active organization" }, { status: 400 });
    }

    // Build tools context with required credentials and project scope
    const toolsContext = buildToolsContext(
      authContext.organizationId,
      authContext.userId,
      {
        projectId,
        environmentId,
        agentType,
      }
    );

    // Create agent with type-specific prompt
    const agent = createAgent(agentType);

    // If agentType provided, create or update AgentSession for persistence
    let agentSessionId: string | undefined;
    if (agentType && authContext.organizationId) {
      try {
        if (sessionId) {
          // Update existing session status to running
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agents/sessions/${sessionId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "running" }),
            }
          );
          agentSessionId = sessionId;
        } else {
          // Create new session
          const project = await prisma.project.findFirst({
            where: { organizationId: authContext.organizationId },
            select: { id: true },
          });
          if (project) {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agents/sessions`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  projectId: project.id,
                  name: `${agentType} agent session`,
                  type: agentType,
                }),
              }
            );
            const data = await res.json();
            agentSessionId = data.data?.id;
          }
        }
      } catch (err) {
        // Non-critical — session creation is best-effort
        console.warn("[AI Chat] Failed to create/update agent session:", err);
      }
    }

    // Convert UI messages to model messages for the agent
    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    // Stream response using agent - agent.stream() handles tool loop internally
    const result = await agent.stream({
      messages: modelMessages,
    });

    // Use createUIMessageStreamResponse to properly handle tool invocations and results
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => {
          if (APICallError.isInstance(error)) {
            if (error.statusCode === 429) return "Rate limit reached. Please try again shortly.";
            if (error.statusCode === 401) return "Invalid API key.";
            if (error.statusCode === 403) return "Access denied to AI service.";
            if (error.isRetryable) return "The AI service is temporarily unavailable.";
            return "AI service error. Please try again.";
          }
          if (RetryError.isInstance(error)) return "Failed after multiple retries. Please try again.";
          // Never leak internal details
          console.error("[AI Chat Stream Error]", error);
          return "Something went wrong. Please try again.";
        },
      }),
      // Include agent metadata in response headers for client awareness
      headers: agentSessionId
        ? { "X-Agent-Session-Id": agentSessionId, "X-Agent-Type": agentType }
        : undefined,
    });
  } catch (error) {
    console.error("[AI Chat Error]", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (APICallError.isInstance(error)) {
      if (error.statusCode === 429) {
        return Response.json({ error: "Rate limit reached. Please try again shortly." }, { status: 429 });
      }
      if (error.statusCode === 401) {
        return Response.json({ error: "Invalid API key." }, { status: 401 });
      }
    }

    if (RetryError.isInstance(error)) {
      return Response.json({ error: "AI service temporarily unavailable." }, { status: 503 });
    }

    return Response.json({ error: "Failed to process chat request" }, { status: 500 });
  }
}
