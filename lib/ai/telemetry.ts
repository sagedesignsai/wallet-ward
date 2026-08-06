import { createHash } from "node:crypto"
import type { Tool } from "ai"
import {
  canonicalizeAuditRecord,
  sha256Hex,
  writeAuditLog,
} from "@/lib/services/audit"
import type { AgentRuntimeContext } from "@/lib/ai/context-builders"

/**
 * Phase 2 — agent action telemetry.
 *
 * `withToolTelemetry` wraps a tool's execute so every invocation records ONE
 * `tool_call` audit row once the tool actually completes (success or error).
 * The write is fire-and-forget with a loud failure log — telemetry must never
 * fail, delay, or alter the tool path itself.
 *
 * Generator tools (e.g. delegateToAgent) are handled specially: they return an
 * AsyncGenerator the moment they are awaited, so the row is written when the
 * stream finishes, not when the generator is handed back.
 *
 * Rows are agent-actor records: audit.ts stores `actorUserId` only for
 * `actorType === "user"`, so the triggering user is preserved in metadata.
 */

/**
 * Agent-actor context adapter. Casts are deliberate: "agent" is not a member
 * of AuthContext["actorType"], and audit.ts nulls actorUserId for non-users.
 */
export const agentActorCtx: Parameters<typeof writeAuditLog>[0]["ctx"] = {
  userId: null as unknown as string,
  actorType: "agent" as unknown as "user" | "api_key",
  ipAddress: null,
  userAgent: null,
  apiKeyId: undefined,
}

export interface ToolTelemetryContext {
  organizationId: string
  userId?: string
  requestId?: string
  agentType?: string
}

export function telemetryFromRuntimeContext(
  runtimeContext: AgentRuntimeContext | undefined
): ToolTelemetryContext | null {
  if (!runtimeContext?.organizationId) return null
  return {
    organizationId: runtimeContext.organizationId,
    userId: runtimeContext.userId,
    requestId: runtimeContext.requestId,
    agentType: runtimeContext.agentType,
  }
}

type AuditLogWrite = Parameters<typeof writeAuditLog>[0]

/**
 * Fire-and-forget audit write with the R9 loud-failure contract: never throw
 * into the caller, and never swallow failures silently (audit evidence must
 * not vanish without trace). Centralizes the canonical failure log format.
 */
export function bestEffortAuditWrite(input: AuditLogWrite): void {
  const { ctx, organizationId, action, resourceType, resourceId, metadata } =
    input
  writeAuditLog({
    ctx,
    organizationId,
    action,
    resourceType,
    resourceId,
    metadata,
  }).catch((error) => {
    console.error(
      "[audit] %s write failed (org=%s, resource=%s):",
      action,
      organizationId,
      resourceId ?? "(none)",
      error
    )
  })
}

function writeToolCallRow(
  toolName: string,
  telemetry: ToolTelemetryContext,
  input: unknown,
  output: unknown,
  outcome: "success" | "error",
  durationMs: number
): void {
  bestEffortAuditWrite({
    ctx: agentActorCtx,
    organizationId: telemetry.organizationId,
    action: "tool_call",
    resourceType: "tool",
    resourceId: toolName,
    metadata: {
      tool: toolName,
      inputHash: sha256Hex(canonicalizeAuditRecord({ input: input ?? {} })),
      outputHash: sha256Hex(canonicalizeAuditRecord({ output: output ?? {} })),
      outcome,
      durationMs,
      ...(telemetry.requestId ? { requestId: telemetry.requestId } : {}),
      ...(telemetry.agentType ? { agentType: telemetry.agentType } : {}),
      ...(telemetry.userId ? { userId: telemetry.userId } : {}),
    },
  })
}

/**
 * Wrap a single tool so each invocation records one `tool_call` audit row.
 *
 * Async-function tools: the row is written after `execute` resolves (or
 * throws). Async-generator tools (e.g. delegateToAgent) return their stream
 * immediately, so the row is written when the stream finishes — re-yielding
 * every part as-is preserves streaming, UI consumption and toModelOutput.
 */
export function withToolTelemetry<TOOL extends Tool>(
  toolName: string,
  tool: TOOL,
  telemetry: ToolTelemetryContext
): TOOL {
  const originalExecute = tool.execute
  if (!originalExecute) {
    // Every wrapped tool is executable (verified 33/33). Fail loudly at wrap
    // time rather than emit a false-success row for a non-executable tool.
    throw new Error(
      `withToolTelemetry: tool '${toolName}' has no execute function`
    )
  }

  if (originalExecute.constructor?.name === "AsyncGeneratorFunction") {
    // Parameters are typed `any` (rather than the SDK's generics) so the
    // wrapper stays assignable to every tool's execute signature.
    const wrappedExecute: TOOL["execute"] = async function* (
      input: any,
      options: any
    ) {
      const startedAt = Date.now()
      // Incremental fingerprint of the streamed output: parts are re-yielded
      // as-is and never buffered whole.
      const streamHash = createHash("sha256")
      try {
        const stream = originalExecute(input, options) as AsyncIterable<any>
        for await (const part of stream) {
          streamHash.update(canonicalizeAuditRecord({ part }))
          yield part
        }
        writeToolCallRow(
          toolName,
          telemetry,
          input,
          { streamHash: streamHash.digest("hex") },
          "success",
          Date.now() - startedAt
        )
      } catch (error) {
        writeToolCallRow(
          toolName,
          telemetry,
          input,
          { error: error instanceof Error ? error.message : String(error) },
          "error",
          Date.now() - startedAt
        )
        throw error
      }
    }
    return { ...tool, execute: wrappedExecute }
  }

  // Regular async tools: one row after execute resolves (success) or throws.
  const wrappedExecute: TOOL["execute"] = async (input: any, options: any) => {
    const startedAt = Date.now()
    let outcome: "success" | "error" = "success"
    let output: unknown = undefined
    try {
      output = await originalExecute(input, options)
      return output
    } catch (error) {
      outcome = "error"
      output = { error: error instanceof Error ? error.message : String(error) }
      throw error
    } finally {
      writeToolCallRow(
        toolName,
        telemetry,
        input,
        output,
        outcome,
        Date.now() - startedAt
      )
    }
  }

  return { ...tool, execute: wrappedExecute }
}

/**
 * Wrap a whole tool set, naming each tool by its key. The return type mirrors
 * the input so SDK generic inference (toolsContext validation) is unchanged.
 */
export function wrapAgentTools<TOOLS extends Record<string, Tool>>(
  tools: TOOLS,
  telemetry: ToolTelemetryContext
): TOOLS {
  const wrapped: Record<string, Tool> = {}
  for (const [name, tool] of Object.entries(tools)) {
    wrapped[name] = withToolTelemetry(name, tool, telemetry)
  }
  // Each entry keeps its original type (execute is overridden with an
  // assignable function), so reasserting the input shape is safe.
  return wrapped as unknown as TOOLS
}
