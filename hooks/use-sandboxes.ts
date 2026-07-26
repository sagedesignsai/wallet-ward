"use client"

import { useState, useEffect, useCallback } from "react"

export type SandboxInfo = {
  id: string
  name: string
  state: string
  cpu: number
  memory: number
  disk: number
  createdAt: string
  previewUrl?: string
}

export function useSandboxes() {
  const [sandboxes, setSandboxes] = useState<SandboxInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [daytonaConfigured, setDaytonaConfigured] = useState<boolean | null>(
    null
  )
  const [creating, setCreating] = useState(false)

  const fetchSandboxes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch("/api/agents/sandboxes", {
        credentials: "include",
      })
      const data = await res.json()

      if (res.status === 503 && data.error?.code === "not_configured") {
        setDaytonaConfigured(false)
        setSandboxes([])
        return
      }

      if (!res.ok) {
        setError(data.error?.message ?? "Failed to load sandboxes")
        return
      }

      setDaytonaConfigured(true)
      setSandboxes(data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sandboxes")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSandboxes()
  }, [fetchSandboxes])

  const createSandbox = useCallback(
    async (name: string, language = "javascript"): Promise<boolean> => {
      if (!name.trim()) return false
      setCreating(true)
      try {
        const res = await fetch("/api/agents/sandboxes", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), language }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setError(data?.error?.message ?? "Failed to create sandbox")
          return false
        }
        await fetchSandboxes()
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create sandbox"
        )
        return false
      } finally {
        setCreating(false)
      }
    },
    [fetchSandboxes]
  )

  const sandboxAction = useCallback(
    async (
      sandboxId: string,
      action: "stop" | "start" | "delete"
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/agents/sandboxes/${sandboxId}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setError(data?.error?.message ?? `Failed to ${action} sandbox`)
          return false
        }
        await fetchSandboxes()
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Failed to ${action} sandbox`
        )
        return false
      }
    },
    [fetchSandboxes]
  )

  const activeCount = sandboxes.filter(
    (s) => s.state === "STARTED" || s.state === "STARTING"
  ).length

  return {
    sandboxes,
    isLoading,
    error,
    daytonaConfigured,
    creating,
    activeCount,
    refetch: fetchSandboxes,
    createSandbox,
    sandboxAction,
    clearError: () => setError(null),
  }
}
