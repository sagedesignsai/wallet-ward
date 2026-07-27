"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import type { ActionProposalDto } from "@/components/proposals/approval-card"
import type { ProposalStatus } from "@prisma/client"

const POLL_INTERVAL_MS = 8_000

type UseProposalsOptions = {
  /** When omitted, fetches org-wide via /api/v1/proposals */
  projectId?: string
  status?: ProposalStatus
  limit?: number
  polling?: boolean
  onSuccess?: () => void
  /** When true, fetch even without projectId (org-wide). Default true. */
  orgWide?: boolean
}

export function useProposals(options: UseProposalsOptions = {}) {
  const orgWide = options.orgWide !== false
  const [proposals, setProposals] = useState<ActionProposalDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)
  const isMountedRef = useRef(true)

  const canFetch = Boolean(options.projectId) || orgWide

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
        const params = new URLSearchParams()
        if (options.status) params.set("status", options.status)
        if (options.limit) params.set("limit", options.limit.toString())

        const url = options.projectId
          ? `/api/v1/projects/${options.projectId}/proposals?${params.toString()}`
          : `/api/v1/proposals?${params.toString()}`

        const res = await fetch(url, { credentials: "include" })

        if (!res.ok) {
          throw new Error(`Failed to fetch proposals: ${res.statusText}`)
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.projectId, options.status, options.limit, canFetch]
  )

  useEffect(() => {
    isMountedRef.current = true
    if (canFetch) {
      fetchProposals()
    }
    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.projectId, options.status, canFetch])

  useEffect(() => {
    if (!options.polling || !canFetch) return

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchProposals({ silent: true })
      }
    }, POLL_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchProposals({ silent: true })
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [options.polling, canFetch, fetchProposals])

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
  }
}
