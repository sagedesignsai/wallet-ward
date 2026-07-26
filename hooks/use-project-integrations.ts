"use client"

import { useState, useEffect, useCallback } from "react"

export type ProjectIntegration = {
  id: string
  projectId: string
  provider: string
  name: string
  enabled: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

type IntegrationsResponse = { data: ProjectIntegration[] }
type IntegrationResponse = { data: ProjectIntegration }

export function useProjectIntegrations(projectId: string) {
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIntegrations = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/integrations`,
        { credentials: "include" }
      )
      if (!res.ok) {
        throw new Error(`Failed to load integrations (${res.status})`)
      }
      const body: IntegrationsResponse = await res.json()
      setIntegrations(body.data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load integrations."
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  const setEnabled = useCallback(
    async (integrationId: string, enabled: boolean): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/integrations/${encodeURIComponent(integrationId)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled }),
          }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to update integration (${res.status})`
          )
        }
        const body: IntegrationResponse = await res.json()
        setIntegrations((prev) =>
          prev.map((i) => (i.id === integrationId ? body.data : i))
        )
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update integration."
        )
        return false
      }
    },
    [projectId]
  )

  const deleteIntegration = useCallback(
    async (integrationId: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/integrations/${encodeURIComponent(integrationId)}`,
          { method: "DELETE", credentials: "include" }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to delete integration (${res.status})`
          )
        }
        setIntegrations((prev) => prev.filter((i) => i.id !== integrationId))
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete integration."
        )
        return false
      }
    },
    [projectId]
  )

  return {
    integrations,
    isLoading,
    error,
    refetch: fetchIntegrations,
    setEnabled,
    deleteIntegration,
  }
}
