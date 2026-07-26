"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import type { ActionProposalDto } from "@/components/proposals/approval-card"

export function useProposal(proposalId: string | undefined) {
  const [proposal, setProposal] = useState<ActionProposalDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const fetchProposal = useCallback(async () => {
    if (!proposalId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/proposals/${encodeURIComponent(proposalId)}`,
        { credentials: "include" }
      )
      if (!res.ok) {
        throw new Error(`Failed to load proposal (${res.status})`)
      }
      const body = await res.json()
      if (isMountedRef.current) {
        setProposal(body.data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to load proposal."
        )
        setProposal(null)
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [proposalId])

  useEffect(() => {
    isMountedRef.current = true
    fetchProposal()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchProposal])

  const approveProposal = useCallback(
    async (notes?: string) => {
      if (!proposal) return
      setIsActing(true)
      try {
        const res = await fetch(
          `/api/v1/projects/${proposal.projectId}/proposals/${proposal.id}/approve`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
          }
        )
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(
            errBody.error?.message || errBody.error || `Approval failed`
          )
        }
        const result = await res.json()
        toast.success("Proposal approved", {
          description:
            result.execution?.message || "Action executed successfully",
        })
        if (isMountedRef.current) {
          setProposal(result.data)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        toast.error("Failed to approve proposal", {
          description: error.message,
        })
        throw error
      } finally {
        setIsActing(false)
      }
    },
    [proposal]
  )

  const rejectProposal = useCallback(
    async (notes?: string) => {
      if (!proposal) return
      setIsActing(true)
      try {
        const res = await fetch(
          `/api/v1/projects/${proposal.projectId}/proposals/${proposal.id}/reject`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
          }
        )
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(
            errBody.error?.message || errBody.error || `Rejection failed`
          )
        }
        const result = await res.json()
        toast.success("Proposal rejected", {
          description: "The action will not be executed",
        })
        if (isMountedRef.current) {
          setProposal(result.data)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        toast.error("Failed to reject proposal", {
          description: error.message,
        })
        throw error
      } finally {
        setIsActing(false)
      }
    },
    [proposal]
  )

  return {
    proposal,
    isLoading,
    isActing,
    error,
    refetch: fetchProposal,
    approveProposal,
    rejectProposal,
  }
}
