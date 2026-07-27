"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { openSSE, type SSEHandle } from "@/lib/sse-client"
import type { ActionProposalDto } from "@/components/proposals/approval-card"
import type { ProposalStatus } from "@prisma/client"

const POLL_INTERVAL_MS = 8_000
const FALLBACK_POLL_INTERVAL_MS = 8_000
const MAX_SSE_FAILURES = 3

type ConnectionState = "connecting" | "connected" | "reconnecting" | "fallback_polling" | "disconnected"

type UseProposalsStreamOptions = {
  projectId?: string
  status?: ProposalStatus
  limit?: number
  polling?: boolean
  onSuccess?: () => void
  orgWide?: boolean
}

export function useProposalsStream(options: UseProposalsStreamOptions = {}) {
  const orgWide = options.orgWide !== false
  const [proposals, setProposals] = useState<ActionProposalDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [isStreaming, setIsStreaming] = useState(false)

  const isMountedRef = useRef(true)
  const sseRef = useRef<SSEHandle | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sseFailureCountRef = useRef(0)

  const canFetch = Boolean(options.projectId) || orgWide

  const buildFetchUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (options.status) params.set("status", options.status)
    if (options.limit) params.set("limit", options.limit.toString())
    if (options.projectId) params.set("projectId", options.projectId)

    return options.projectId
      ? `/api/v1/projects/${options.projectId}/proposals?${params.toString()}`
      : `/api/v1/proposals?${params.toString()}`
  }, [options.projectId, options.status, options.limit])

  const buildSSEUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (options.status) params.set("status", options.status)
    if (options.projectId) params.set("projectId", options.projectId)
    const qs = params.toString()
    return `/api/v1/proposals/stream${qs ? `?${qs}` : ""}`
  }, [options.projectId, options.status])

  const fetchProposals = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!canFetch) return

      if (opts.silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
        setError(null)
      }

      try {
        const res = await fetch(buildFetchUrl(), { credentials: "include" })
        if (!res.ok) throw new Error(`Failed to fetch proposals: ${res.statusText}`)
        const data = await res.json()
        if (isMountedRef.current) {
          setProposals(data.data || [])
          setLastFetchedAt(new Date())
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        if (isMountedRef.current) setError(error)
        if (!opts.silent) {
          toast.error("Failed to load proposals", { description: error.message })
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [canFetch, buildFetchUrl]
  )

  const startPolling = useCallback(() => {
    stopPolling()
    if (!canFetch) return
    setConnectionState("fallback_polling")
    setIsStreaming(false)
    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchProposals({ silent: true })
      }
    }, FALLBACK_POLL_INTERVAL_MS)
  }, [canFetch, fetchProposals])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const startSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
    if (!canFetch) return

    setConnectionState("connecting")
    setIsStreaming(true)

    const handle = openSSE(
      {
        url: buildSSEUrl(),
        onOpen: () => {
          if (isMountedRef.current) {
            setConnectionState("connected")
            sseFailureCountRef.current = 0
          }
        },
        onError: () => {
          if (!isMountedRef.current) return
          sseFailureCountRef.current++
          if (sseFailureCountRef.current >= MAX_SSE_FAILURES) {
            handle.close()
            sseRef.current = null
            startPolling()
          } else {
            setConnectionState("reconnecting")
          }
        },
      },
      (event, data) => {
        if (!isMountedRef.current) return

        if (event === "status_change") {
          try {
            const parsed = JSON.parse(data)
            if (parsed.proposal) {
              setProposals((prev) =>
                prev.map((p) =>
                  p.id === parsed.proposalId ? parsed.proposal : p
                )
              )
            }
            // Full refetch for consistency
            fetchProposals({ silent: true })
          } catch {
            // ignore parse errors
          }
        }
      }
    )

    sseRef.current = handle
  }, [canFetch, buildSSEUrl, fetchProposals, startPolling])

  // Initial fetch + SSE on mount
  useEffect(() => {
    isMountedRef.current = true
    if (canFetch) {
      fetchProposals().then(() => {
        if (isMountedRef.current) {
          startSSE()
        }
      })
    }
    return () => {
      isMountedRef.current = false
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.projectId, options.status, canFetch])

  // Visibility change handling
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && canFetch) {
        fetchProposals({ silent: true })
        if (!sseRef.current && !pollTimerRef.current) {
          startSSE()
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [canFetch, fetchProposals, startSSE])

  const resolveProjectId = useCallback(
    (proposalId: string) => {
      if (options.projectId) return options.projectId
      return proposals.find((p) => p.id === proposalId)?.projectId
    },
    [options.projectId, proposals]
  )

  const approveProposal = useCallback(
    async (proposalId: string, notes?: string) => {
      const projectId = resolveProjectId(proposalId)
      if (!projectId) {
        toast.error("Cannot approve", {
          description: "Missing project context for this proposal",
        })
        return
      }

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/proposals/${proposalId}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
          }
        )

        if (!res.ok) {
          const error = await res.json().catch(() => ({}))
          throw new Error(
            error.error?.message || error.error || `Approval failed: ${res.statusText}`
          )
        }

        const result = await res.json()
        toast.success("Proposal approved", {
          description: result.execution?.message || "Action executed successfully",
        })
        await fetchProposals()
        options.onSuccess?.()
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        toast.error("Failed to approve proposal", { description: error.message })
        throw error
      }
    },
    [resolveProjectId, options.onSuccess, fetchProposals]
  )

  const rejectProposal = useCallback(
    async (proposalId: string, notes?: string) => {
      const projectId = resolveProjectId(proposalId)
      if (!projectId) {
        toast.error("Cannot reject", {
          description: "Missing project context for this proposal",
        })
        return
      }

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/proposals/${proposalId}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
          }
        )

        if (!res.ok) {
          const error = await res.json().catch(() => ({}))
          throw new Error(
            error.error?.message || error.error || `Rejection failed: ${res.statusText}`
          )
        }

        toast.success("Proposal rejected", {
          description: "The action will not be executed",
        })
        await fetchProposals()
        options.onSuccess?.()
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        toast.error("Failed to reject proposal", { description: error.message })
        throw error
      }
    },
    [resolveProjectId, options.onSuccess, fetchProposals]
  )

  return {
    proposals,
    isLoading,
    isRefreshing,
    error,
    lastFetchedAt,
    fetchProposals: () => fetchProposals(),
    approveProposal,
    rejectProposal,
    connectionState,
    isStreaming,
  }
}
