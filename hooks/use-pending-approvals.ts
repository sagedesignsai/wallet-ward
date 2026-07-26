"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ActionProposalDto } from "@/components/proposals/approval-card"

const POLL_INTERVAL_MS = 8_000 // 8 seconds

export function usePendingApprovals() {
  const [proposals, setProposals] = useState<ActionProposalDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null)
  const isMountedRef = useRef(true)

  const fetch_ = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await fetch("/api/v1/proposals?status=awaiting_approval&limit=20", {
        credentials: "include",
      })
      if (!res.ok) return
      const body = await res.json()
      if (isMountedRef.current) {
        setProposals(body.data ?? [])
        setLastFetchedAt(new Date())
      }
    } catch {
      // swallow — polling errors are non-fatal
    } finally {
      if (isMountedRef.current && !silent) setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    isMountedRef.current = true
    fetch_(false)
    return () => {
      isMountedRef.current = false
    }
  }, [fetch_])

  // Polling — only while tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetch_(true)
      }
    }, POLL_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetch_(true)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetch_])

  return {
    proposals,
    count: proposals.length,
    isLoading,
    lastFetchedAt,
    refresh: () => fetch_(false),
  }
}
