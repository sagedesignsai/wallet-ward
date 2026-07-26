"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export type AgentType = "coding" | "content" | "ops" | "research"
export type AgentStatus =
  | "idle"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"

export type AgentSessionDto = {
  id: string
  projectId: string
  name: string
  type: AgentType
  status: AgentStatus
  prompt: string | null
  daytonaSandboxId: string | null
  sandboxUrl: string | null
  currentTask: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

type UseAgentSessionsOptions = {
  projectId?: string
  status?: AgentStatus
  type?: AgentType
  limit?: number
  polling?: boolean
}

const POLL_INTERVAL_MS = 8_000

function normalizeSession(raw: Record<string, unknown>): AgentSessionDto {
  return {
    id: String(raw.id),
    projectId: String(raw.projectId),
    name: String(raw.name),
    type: (raw.type as AgentType) ?? "coding",
    status: (raw.status as AgentStatus) ?? "idle",
    prompt: (raw.prompt as string | null) ?? null,
    daytonaSandboxId: (raw.daytonaSandboxId as string | null) ?? null,
    sandboxUrl: (raw.sandboxUrl as string | null) ?? null,
    currentTask: (raw.currentTask as string | null) ?? null,
    metadata: (raw.metadata as Record<string, unknown> | null) ?? null,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(raw.createdAt as string).toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date(raw.updatedAt as string).toISOString(),
  }
}

export function useAgentSessions(options: UseAgentSessionsOptions = {}) {
  const [sessions, setSessions] = useState<AgentSessionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)
  const isMountedRef = useRef(true)

  const fetchSessions = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (opts.silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
        setError(null)
      }

      try {
        const params = new URLSearchParams()
        if (options.projectId) params.set("projectId", options.projectId)
        if (options.status) params.set("status", options.status)
        if (options.type) params.set("type", options.type)
        if (options.limit) params.set("limit", String(options.limit))

        const res = await fetch(`/api/agents/sessions?${params}`, {
          credentials: "include",
        })
        if (!res.ok) {
          throw new Error(`Failed to load agent sessions (${res.status})`)
        }
        const body = await res.json()
        if (isMountedRef.current) {
          setSessions(
            (body.data ?? []).map((s: Record<string, unknown>) =>
              normalizeSession(s)
            )
          )
          setLastFetchedAt(new Date())
        }
      } catch (err) {
        if (isMountedRef.current && !opts.silent) {
          setError(
            err instanceof Error ? err.message : "Failed to load agent sessions."
          )
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [options.projectId, options.status, options.type, options.limit]
  )

  useEffect(() => {
    isMountedRef.current = true
    fetchSessions()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchSessions])

  useEffect(() => {
    if (!options.polling) return

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchSessions({ silent: true })
      }
    }, POLL_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchSessions({ silent: true })
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [options.polling, fetchSessions])

  const createSession = useCallback(
    async (input: {
      projectId: string
      name: string
      type?: AgentType
      prompt?: string
      metadata?: Record<string, unknown>
    }): Promise<AgentSessionDto | null> => {
      try {
        const res = await fetch("/api/agents/sessions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to create session (${res.status})`
          )
        }
        const body = await res.json()
        const session = normalizeSession(body.data)
        setSessions((prev) => [session, ...prev])
        return session
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create session."
        )
        return null
      }
    },
    []
  )

  return {
    sessions,
    isLoading,
    isRefreshing,
    error,
    lastFetchedAt,
    refetch: () => fetchSessions(),
    createSession,
  }
}
