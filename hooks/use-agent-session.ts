"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type {
  AgentSessionDto,
  AgentStatus,
} from "@/hooks/use-agent-sessions"

export type SessionProposalSummary = {
  id: string
  title: string
  description?: string
  riskLevel?: string
  actionType: string
  targetSystem?: string
  status: string
  createdAt: string
  approvalNotes?: string | null
  rejectionNotes?: string | null
  payload?: Record<string, unknown>
}

export type SessionPendingProposals = {
  awaiting: SessionProposalSummary[]
  approved: SessionProposalSummary[]
  rejected: SessionProposalSummary[]
  executed: SessionProposalSummary[]
  failed: SessionProposalSummary[]
}

function normalizeSession(raw: Record<string, unknown>): AgentSessionDto {
  return {
    id: String(raw.id),
    projectId: String(raw.projectId),
    name: String(raw.name),
    type: (raw.type as AgentSessionDto["type"]) ?? "coding",
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

export function useAgentSession(sessionId: string | undefined) {
  const [session, setSession] = useState<AgentSessionDto | null>(null)
  const [pendingProposals, setPendingProposals] =
    useState<SessionPendingProposals | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const [sessionRes, proposalsRes] = await Promise.all([
        fetch(`/api/agents/sessions/${encodeURIComponent(sessionId)}`, {
          credentials: "include",
        }),
        fetch(
          `/api/agents/sessions/${encodeURIComponent(sessionId)}/pending-proposals`,
          { credentials: "include" }
        ),
      ])

      if (!sessionRes.ok) {
        throw new Error(`Failed to load session (${sessionRes.status})`)
      }

      const sessionBody = await sessionRes.json()
      if (isMountedRef.current) {
        setSession(normalizeSession(sessionBody.data))
      }

      if (proposalsRes.ok) {
        const proposalsBody = await proposalsRes.json()
        if (isMountedRef.current) {
          setPendingProposals(proposalsBody.pendingProposals ?? null)
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load session.")
        setSession(null)
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    isMountedRef.current = true
    fetchSession()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchSession])

  const updateSession = useCallback(
    async (patch: {
      status?: AgentStatus
      name?: string
      currentTask?: string | null
      daytonaSandboxId?: string | null
      sandboxUrl?: string | null
      metadata?: Record<string, unknown>
    }): Promise<AgentSessionDto | null> => {
      if (!sessionId) return null
      try {
        const res = await fetch(
          `/api/agents/sessions/${encodeURIComponent(sessionId)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to update session (${res.status})`
          )
        }
        const body = await res.json()
        const updated = normalizeSession(body.data)
        setSession(updated)
        return updated
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update session."
        )
        return null
      }
    },
    [sessionId]
  )

  const deleteSession = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false
    try {
      const res = await fetch(
        `/api/agents/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE", credentials: "include" }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(
          body?.error?.message ?? `Failed to delete session (${res.status})`
        )
      }
      setSession(null)
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete session."
      )
      return false
    }
  }, [sessionId])

  return {
    session,
    pendingProposals,
    isLoading,
    error,
    refetch: fetchSession,
    updateSession,
    deleteSession,
  }
}
