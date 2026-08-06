"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  opencodeAbort,
  opencodeCreateSession,
  opencodeMessages,
  opencodePrompt,
  streamOpencodeEvents,
  type MessagePartUpdatedEvent,
  type OpencodeEvent,
  type OpencodePart,
} from "@/lib/opencode/client"
import { messageBus } from "@/lib/desktop/message-bus"

export type OpencodeSessionStatus = "connecting" | "ready" | "busy" | "idle" | "error"

interface SessionMessage {
  info: { id: string; role?: string }
  /** Parts keyed by id — insertion order = stream order. */
  parts: Record<string, OpencodePart>
}

export interface UseOpencodeSessionOptions {
  /** OpenCode server base URL (sandbox preview URL). Null = disconnected. */
  baseUrl: string | null
  /** OpenCode session id. Null = auto-create on connect. */
  sessionId?: string | null
  /** Pause connection while false. */
  enabled?: boolean
}

const RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_DELAY_MS = 2000

/**
 * Live OpenCode session: subscribes to the server's SSE stream, accumulates
 * message parts, and mirrors tool/status activity onto the desktop message
 * bus so existing surfaces (workbench tabs, windows) react — e.g.
 * `agent:tool_call_result`, `agent:sandbox_ready`, `agent:action_proposed`.
 */
export function useOpencodeSession({
  baseUrl,
  sessionId: initialSessionId,
  enabled = true,
}: UseOpencodeSessionOptions) {
  const [status, setStatus] = useState<OpencodeSessionStatus>("idle")
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [lastError, setLastError] = useState<string | null>(null)

  const messagesRef = useRef<SessionMessage[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const disposedRef = useRef(false)

  const syncMessages = () => setMessages([...messagesRef.current])

  const upsertPart = useCallback((part: OpencodePart, delta?: string) => {
    const list = messagesRef.current
    let message = list.find((m) => m.info.id === part.messageID)
    if (!message) {
      message = { info: { id: part.messageID }, parts: {} }
      list.push(message)
    }

    const existing = message.parts[part.id]
    if (existing && delta && existing.type === "text") {
      // Streaming chunk — delta carries the new slice, append it.
      message.parts[part.id] = { ...existing, text: existing.text + delta }
    } else {
      message.parts[part.id] = part
    }
  }, [])

  const handleEvent = useCallback(
    (event: OpencodeEvent) => {
      switch (event.type) {
        case "server.connected":
          setStatus("ready")
          break

        case "message.part.updated": {
          const { part, delta } = (event as unknown as MessagePartUpdatedEvent)
            .properties
          upsertPart(part, delta)
          syncMessages()

          if (part.type === "tool") {
            const state = part.state
            const payload = {
              tool: part.tool,
              callID: part.callID,
              ...(state.title ? { title: state.title } : {}),
              ...(state.output ? { output: state.output } : {}),
              ...(state.error ? { error: state.error } : {}),
            }
            if (state.status === "pending" || state.status === "running") {
              messageBus.getState().send({
                from: "opencode-agent",
                to: "*",
                type: "agent:tool_call_start",
                payload,
              })
            } else if (state.status === "completed" || state.status === "error") {
              messageBus.getState().send({
                from: "opencode-agent",
                to: "*",
                type: "agent:tool_call_result",
                payload,
              })
            }
          }
          break
        }

        case "session.status": {
          const status = (event as { properties: { status?: { type: string } } }).properties?.status
          if (status?.type === "busy") setStatus("busy")
          else if (status?.type === "idle") setStatus("idle")
          else if (status?.type === "retry") setStatus("error")
          break
        }

        case "session.idle":
          setStatus("idle")
          break

        case "session.error":
          setStatus("error")
          setLastError("OpenCode session errored")
          break

        case "permission.updated":
          messageBus.getState().send({
            from: "opencode-agent",
            to: "*",
            type: "agent:action_proposed",
            payload: event.properties ?? {},
          })
          break

        default:
          break
      }
    },
    [upsertPart],
  )

  // Hydrate history for an existing session.
  const hydrate = useCallback(
    async (base: string, id: string) => {
      const history = await opencodeMessages(base, id, 100)
      messagesRef.current = history.map((m) => ({
        info: { id: m.info.id, role: m.info.role },
        parts: Object.fromEntries(m.parts.map((p) => [p.id, p])) as Record<string, OpencodePart>,
      }))
      syncMessages()
    },
    [],
  )

  const connect = useCallback(
    async (base: string, id: string, isNewSession: boolean) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setStatus("connecting")
      if (!isNewSession) await hydrate(base, id)

      const attempt = async (): Promise<void> => {
        try {
          await streamOpencodeEvents(base, {
            signal: controller.signal,
            onEvent: handleEvent,
          })
        } catch {
          // handled below via onError/abort semantics
        }
        // Stream ended. If we're not disposed/aborted, reconnect with backoff.
        if (controller.signal.aborted || disposedRef.current) return
        if (reconnectAttemptRef.current < RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttemptRef.current
          reconnectAttemptRef.current += 1
          reconnectTimerRef.current = setTimeout(() => void attempt(), delay)
        } else {
          setStatus("error")
          setLastError("Lost connection to OpenCode server")
        }
      }

      await attempt()
    },
    [handleEvent, hydrate],
  )

  useEffect(() => {
    if (!enabled || !baseUrl) return
    disposedRef.current = false
    reconnectAttemptRef.current = 0

    let cancelled = false
    void (async () => {
      let id = initialSessionId ?? null
      if (!id) {
        id = (await opencodeCreateSession(baseUrl, "Workspace")) ?? null
        if (cancelled || disposedRef.current) return
        if (id) setSessionId(id)
      }
      if (id) {
        // A fresh server reports no history; hydrate only when we already had
        // the session id coming in (reconnect / resume).
        await connect(baseUrl, id, !initialSessionId)
      } else {
        setStatus("error")
        setLastError("Failed to create OpenCode session")
      }
    })()

    // Announce the sandbox surface is live (workbench switches to terminal).
    messageBus.getState().send({
      from: "opencode-agent",
      to: "*",
      type: "agent:sandbox_ready",
      payload: { baseUrl },
    })

    return () => {
      cancelled = true
      disposedRef.current = true
      abortRef.current?.abort()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, initialSessionId, enabled])

  const sendPrompt = useCallback(
    async (text: string) => {
      if (!baseUrl || !sessionId || !text.trim()) return
      const trimmed = text.trim()
      upsertPart({ id: `user-${Date.now()}`, sessionID: sessionId, messageID: `user-${Date.now()}`, type: "text", text: trimmed })
      syncMessages()
      setStatus("busy")
      try {
        await opencodePrompt(baseUrl, sessionId, trimmed)
        setStatus("idle")
      } catch (error) {
        setStatus("error")
        setLastError(error instanceof Error ? error.message : "Prompt failed")
      }
    },
    [baseUrl, sessionId, upsertPart],
  )

  const abort = useCallback(async () => {
    if (!baseUrl || !sessionId) return
    try {
      await opencodeAbort(baseUrl, sessionId)
    } finally {
      setStatus("idle")
    }
  }, [baseUrl, sessionId])

  return { status, sessionId, messages, lastError, sendPrompt, abort }
}

export type { SessionMessage as OpencodeSessionMessage }
