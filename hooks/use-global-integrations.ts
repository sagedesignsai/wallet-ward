"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export type GlobalIntegration = {
  id: string
  projectId: string
  provider: string
  name: string
  enabled: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  project: { id: string; name: string; slug: string }
}

type IntegrationsResponse = { data: GlobalIntegration[] }

export type GlobalIntegrationFilters = {
  projectId: string | null
  provider: string | null
  search: string
}

export function useGlobalIntegrations() {
  const [integrations, setIntegrations] = useState<GlobalIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<GlobalIntegrationFilters>({
    projectId: null,
    provider: null,
    search: "",
  })

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/v1/integrations", { credentials: "include" })

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
  }, [])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  const refetch = useCallback(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  const setFilter = useCallback(
    (key: keyof GlobalIntegrationFilters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({ projectId: null, provider: null, search: "" })
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.projectId) count++
    if (filters.provider) count++
    if (filters.search.trim()) count++
    return count
  }, [filters])

  const filtered = useMemo(() => {
    let result = integrations

    if (filters.projectId) {
      result = result.filter((i) => i.projectId === filters.projectId)
    }

    if (filters.provider) {
      result = result.filter((i) => i.provider === filters.provider)
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.provider.toLowerCase().includes(q)
      )
    }

    return result
  }, [integrations, filters])

  const projects = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; slug: string }
    >()
    for (const i of integrations) {
      if (!map.has(i.projectId)) {
        map.set(i.projectId, i.project)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [integrations])

  const providers = useMemo(() => {
    const set = new Set<string>()
    for (const i of integrations) {
      set.add(i.provider)
    }
    return Array.from(set).sort()
  }, [integrations])

  return {
    integrations,
    filtered,
    isLoading,
    error,
    filters,
    activeFilterCount,
    projects,
    providers,
    setFilter,
    clearFilters,
    refetch,
  }
}
