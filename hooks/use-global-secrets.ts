"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export type GlobalSecret = {
  id: string
  projectId: string
  environmentId: string
  name: string
  description: string | null
  type: string
  metadata: Record<string, unknown> | null
  currentVersion: number
  createdAt: string
  updatedAt: string
  project: { id: string; name: string; slug: string }
  environment: { id: string; name: string; slug: string }
}

export type GlobalSecretWithValue = {
  secret: GlobalSecret
  version: number
  value: string
}

type SecretsResponse = { data: GlobalSecret[] }
type SecretValueResponse = { data: GlobalSecretWithValue }

export type GlobalSecretFilters = {
  projectId: string | null
  environmentId: string | null
  type: string | null
  search: string
}

export function useGlobalSecrets() {
  const [secrets, setSecrets] = useState<GlobalSecret[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<GlobalSecretFilters>({
    projectId: null,
    environmentId: null,
    type: null,
    search: "",
  })
  const [revealCache, setRevealCache] = useState<
    Record<string, GlobalSecretWithValue>
  >({})

  const fetchSecrets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/v1/secrets", { credentials: "include" })

      if (!res.ok) {
        throw new Error(`Failed to load secrets (${res.status})`)
      }

      const body: SecretsResponse = await res.json()
      setSecrets(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load secrets.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSecrets()
  }, [fetchSecrets])

  const refetch = useCallback(() => {
    fetchSecrets()
  }, [fetchSecrets])

  const setFilter = useCallback(
    (key: keyof GlobalSecretFilters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({
      projectId: null,
      environmentId: null,
      type: null,
      search: "",
    })
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.projectId) count++
    if (filters.environmentId) count++
    if (filters.type) count++
    if (filters.search.trim()) count++
    return count
  }, [filters])

  const filtered = useMemo(() => {
    let result = secrets

    if (filters.projectId) {
      result = result.filter((s) => s.projectId === filters.projectId)
    }

    if (filters.environmentId) {
      result = result.filter((s) => s.environmentId === filters.environmentId)
    }

    if (filters.type) {
      result = result.filter((s) => s.type === filters.type)
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      )
    }

    return result
  }, [secrets, filters])

  // Derived option lists from full dataset
  const projects = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; slug: string }
    >()
    for (const s of secrets) {
      if (!map.has(s.projectId)) {
        map.set(s.projectId, s.project)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [secrets])

  const environments = useMemo(() => {
    // If a project filter is active, only show environments for that project
    const source = filters.projectId
      ? secrets.filter((s) => s.projectId === filters.projectId)
      : secrets

    const map = new Map<
      string,
      { id: string; name: string; slug: string }
    >()
    for (const s of source) {
      if (!map.has(s.environmentId)) {
        map.set(s.environmentId, s.environment)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [secrets, filters.projectId])

  const types = useMemo(() => {
    const set = new Set<string>()
    for (const s of secrets) {
      set.add(s.type)
    }
    return Array.from(set).sort()
  }, [secrets])

  const revealValue = useCallback(
    async (secretId: string): Promise<GlobalSecretWithValue | null> => {
      if (revealCache[secretId]) {
        return revealCache[secretId]
      }

      try {
        const res = await fetch(
          `/api/v1/secrets/${encodeURIComponent(secretId)}/value`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to reveal value (${res.status})`)
        }

        const body: SecretValueResponse = await res.json()
        setRevealCache((prev) => ({ ...prev, [secretId]: body.data }))
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reveal secret value."
        )
        return null
      }
    },
    [revealCache]
  )

  const deleteSecret = useCallback(
    async (secretId: string): Promise<boolean> => {
      let previous: GlobalSecret[] = []
      setSecrets((prev) => {
        previous = prev
        return prev.filter((s) => s.id !== secretId)
      })

      try {
        const res = await fetch(
          `/api/v1/secrets/${encodeURIComponent(secretId)}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        )

        if (!res.ok) {
          throw new Error(`Failed to delete secret (${res.status})`)
        }

        setRevealCache((prev) => {
          const next = { ...prev }
          delete next[secretId]
          return next
        })

        return true
      } catch (err) {
        setSecrets(previous)
        setError(
          err instanceof Error ? err.message : "Failed to delete secret."
        )
        return false
      }
    },
    []
  )

  return {
    secrets,
    filtered,
    isLoading,
    error,
    filters,
    activeFilterCount,
    projects,
    environments,
    types,
    setFilter,
    clearFilters,
    revealValue,
    deleteSecret,
    refetch,
  }
}
