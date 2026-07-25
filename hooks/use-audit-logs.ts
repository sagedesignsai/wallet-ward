"use client"

import { useState, useEffect, useCallback } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | "organization_create"
  | "project_create"
  | "project_update"
  | "project_delete"
  | "environment_create"
  | "environment_update"
  | "environment_delete"
  | "secret_create"
  | "secret_update"
  | "secret_delete"
  | "secret_reveal"
  | "secret_export"
  | "secret_import"
  | "secret_version_create"
  | "document_create"
  | "document_update"
  | "document_delete"
  | "task_create"
  | "task_update"
  | "task_delete"

export type AuditLog = {
  id: string
  action: AuditAction
  resourceType: string
  resourceId: string | null
  actorType: string
  actorUserId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

type AuditLogsResponse = {
  data: AuditLog[]
  nextCursor: string | null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [fetchToken, setFetchToken] = useState(0)

  const fetchPage = useCallback(
    async (pageCursor: string | null, append: boolean) => {
      try {
        const params = new URLSearchParams({ limit: "50" })
        if (pageCursor) params.set("cursor", pageCursor)

        const res = await fetch(`/api/v1/audit-logs?${params}`, {
          credentials: "include",
        })

        if (!res.ok) {
          throw new Error(`Failed to load audit logs (${res.status})`)
        }

        const body: AuditLogsResponse = await res.json()

        if (append) {
          setLogs((prev) => [...prev, ...body.data])
        } else {
          setLogs(body.data)
        }

        setHasMore(body.nextCursor !== null)
        setCursor(body.nextCursor)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load audit logs."
        )
      }
    },
    []
  )

  // Initial fetch
  useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)
      setCursor(null)
      setHasMore(true)

      try {
        const params = new URLSearchParams({ limit: "50" })
        const res = await fetch(`/api/v1/audit-logs?${params}`, {
          credentials: "include",
        })

        if (!res.ok) {
          throw new Error(`Failed to load audit logs (${res.status})`)
        }

        const body: AuditLogsResponse = await res.json()

        if (cancelled) return

        setLogs(body.data)
        setHasMore(body.nextCursor !== null)
        setCursor(body.nextCursor)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load audit logs."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchToken])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursor) return

    setIsLoadingMore(true)
    await fetchPage(cursor, true)
    setIsLoadingMore(false)
  }, [hasMore, isLoadingMore, cursor, fetchPage])

  const refetch = useCallback(() => {
    setFetchToken((t) => t + 1)
  }, [])

  return {
    logs,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refetch,
  }
}
