/**
 * OpenCode Server Client
 *
 * Minimal, dependency-free client for an OpenCode server running inside a
 * Daytona sandbox (`opencode serve` / `opencode web`). The sandbox's preview
 * URL IS the backend — the browser connects straight to it over HTTP + SSE.
 *
 * Covers the v1 event contract (message.part.updated, session.status, ...)
 * that matches the pinned `opencode-ai@1.1.1` CLI. The server publishes its
 * full OpenAPI spec at `GET /doc` — treat that as authoritative if shapes
 * drift on a version bump.
 *
 * Note: the signed preview URL (token in URL) is the security boundary here,
 * matching the repo's existing web-terminal/desktop window pattern. No custom
 * headers are needed, which keeps browser EventSource/fetch simple.
 */

// ─── Event contract (v1 subset we render) ──────────────────────────────────

export interface OpencodeEvent {
  type: string
  properties?: Record<string, unknown>
}

export type OpencodePart =
  | {
      id: string
      sessionID: string
      messageID: string
      type: "text"
      text: string
    }
  | {
      id: string
      sessionID: string
      messageID: string
      type: "reasoning"
      text: string
      time?: { start: number; end?: number }
    }
  | {
      id: string
      sessionID: string
      messageID: string
      type: "tool"
      callID: string
      tool: string
      state: { status: string; title?: string; output?: string; error?: string }
      metadata?: Record<string, unknown>
    }
  | {
      id: string
      sessionID: string
      messageID: string
      type: "step-start" | "step-finish" | "subtask" | "agent" | "snapshot" | "patch" | "file"
      [key: string]: unknown
    }

export interface OpencodeMessage {
  info: { id: string; role?: string; time?: { created: number } }
  parts: OpencodePart[]
}

/** Streaming event payloads we act on. */
export interface MessagePartUpdatedEvent {
  type: "message.part.updated"
  properties: { part: OpencodePart; delta?: string }
}

export interface SessionStatusEvent {
  type: "session.status" | "session.idle" | "session.error"
  properties: { sessionID: string; status?: { type: "idle" | "busy" | "retry"; attempt?: number; message?: string }; error?: unknown }
}

// ─── URL helper ──────────────────────────────────────────────────────────────

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`
}

// ─── SSE event stream ────────────────────────────────────────────────────────

export interface OpenCodeStreamOptions {
  signal?: AbortSignal
  onEvent?: (event: OpencodeEvent) => void
  onError?: (error: Error) => void
}

/**
 * Connect to `GET /event` (SSE) and invoke onEvent for each parsed payload.
 * Resolves when the stream ends (or rejects on transport error).
 */
export async function streamOpencodeEvents(
  baseUrl: string,
  options: OpenCodeStreamOptions = {},
): Promise<void> {
  const { signal, onEvent, onError } = options
  const response = await fetch(joinUrl(baseUrl, "/event"), {
    headers: { Accept: "text/event-stream" },
    signal,
    cache: "no-store",
  })
  if (!response.ok || !response.body) {
    throw new Error(`OpenCode event stream failed: ${response.status} ${response.statusText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const dispatch = (raw: string) => {
    const dataLine = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"))
    if (!dataLine) return
    const payload = dataLine.slice(5).trim()
    if (!payload || payload === "[DONE]") return
    try {
      onEvent?.(JSON.parse(payload) as OpencodeEvent)
    } catch {
      // Skip malformed frames; keep the stream alive.
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // SSE frames are separated by a blank line.
      let boundary = buffer.search(/\r?\n\r?\n/)
      while (boundary !== -1) {
        dispatch(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + (buffer.startsWith("\r\n", boundary) ? 4 : 2))
        boundary = buffer.search(/\r?\n\r?\n/)
      }
    }
    // Flush any trailing frame without a closing blank line.
    if (buffer.trim()) dispatch(buffer)
  } catch (error) {
    if (signal?.aborted) return // intentional teardown
    onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}

// ─── Session API ─────────────────────────────────────────────────────────────

export async function opencodeCreateSession(
  baseUrl: string,
  title?: string,
): Promise<string | undefined> {
  const response = await fetch(joinUrl(baseUrl, "/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title ?? "Workspace" }),
  })
  if (!response.ok) return undefined
  const data = await response.json().catch(() => null)
  return data?.id ?? undefined
}

/**
 * Send a prompt to a session. Non-blocking from the caller's perspective —
 * progress arrives over the SSE stream; the promise resolves when the turn
 * finishes. (`prompt_async` may not exist on the pinned server version, so we
 * use the blocking endpoint and simply don't await it in the UI.)
 */
export async function opencodePrompt(
  baseUrl: string,
  sessionId: string,
  text: string,
): Promise<void> {
  const response = await fetch(joinUrl(baseUrl, `/session/${sessionId}/prompt`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parts: [{ type: "text", text }] }),
  })
  if (!response.ok) {
    throw new Error(`OpenCode prompt failed: ${response.status} ${response.statusText}`)
  }
}

export async function opencodeAbort(baseUrl: string, sessionId: string): Promise<void> {
  await fetch(joinUrl(baseUrl, `/session/${sessionId}/abort`), { method: "POST" })
}

/** Fetch message history for a session (used to hydrate after reconnect). */
export async function opencodeMessages(
  baseUrl: string,
  sessionId: string,
  limit = 50,
): Promise<OpencodeMessage[]> {
  const response = await fetch(
    joinUrl(baseUrl, `/session/${sessionId}/message?limit=${limit}`),
    { headers: { Accept: "application/json" }, cache: "no-store" },
  )
  if (!response.ok) return []
  const data = await response.json().catch(() => null)
  return Array.isArray(data) ? (data as OpencodeMessage[]) : []
}

/** All-sessions status map, e.g. { [sessionId]: { type: "idle" | "busy" } }. */
export async function opencodeStatus(
  baseUrl: string,
): Promise<Record<string, { type: string }>> {
  const response = await fetch(joinUrl(baseUrl, "/session/status"), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  if (!response.ok) return {}
  const data = await response.json().catch(() => null)
  return (data ?? {}) as Record<string, { type: string }>
}
