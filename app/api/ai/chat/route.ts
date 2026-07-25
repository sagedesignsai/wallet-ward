import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  UIMessage,
  convertToModelMessages,
  APICallError,
  RetryError,
} from "ai";
import { nimbusBaseAgent } from "@/lib/ai/agent";
import { buildToolsContext } from "@/lib/ai/context-helpers";
import { requireAuth } from "@/lib/api/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * AI Chat API Route
 * 
 * Handles streaming chat requests with the Nimbus AI agent.
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
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    if (!authContext.organizationId) {
      return Response.json({ error: "No active organization" }, { status: 400 });
    }

    // Build tools context with required credentials
    const toolsContext = buildToolsContext(
      authContext.organizationId,
      authContext.userId
    );

    // Convert UI messages to model messages for the agent
    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    // Stream response using agent - agent.stream() handles tool loop internally
    const result = await nimbusBaseAgent.stream({
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
