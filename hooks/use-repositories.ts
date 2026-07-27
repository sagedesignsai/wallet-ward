"use client"

import { useState, useEffect, useCallback } from "react"
import type { Repository, RepositoryProvider } from "@prisma/client"

export type RepositoryWithMetadata = Repository & {
  _count?: {
    webhooks: number
  }
}

type RepositoriesResponse = { data: RepositoryWithMetadata[] }
type RepositoryResponse = { data: RepositoryWithMetadata }

export function useRepositories(projectId: string) {
  const [repositories, setRepositories] = useState<RepositoryWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRepositories = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/repositories`, {
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error(`Failed to load repositories (${res.status})`)
      }

      const body: RepositoriesResponse = await res.json()
      setRepositories(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories])

  const refetch = useCallback(() => {
    fetchRepositories()
  }, [fetchRepositories])

  const createRepository = useCallback(
    async (data: {
      name: string
      description?: string
      provider: RepositoryProvider
      url: string
      branch?: string
      accessType: "public" | "private"
      credentialId?: string
    }): Promise<Repository | null> => {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/repositories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to create repository")
        }

        const body: RepositoryResponse = await res.json()
        setRepositories((prev) => [body.data, ...prev])
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create repository.")
        return null
      }
    },
    [projectId]
  )

  const updateRepository = useCallback(
    async (
      repositoryId: string,
      data: {
        name?: string
        description?: string
        branch?: string
        accessType?: "public" | "private"
        credentialId?: string
      }
    ): Promise<Repository | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
          }
        )

        if (!res.ok) {
          throw new Error("Failed to update repository")
        }

        const body: RepositoryResponse = await res.json()
        setRepositories((prev) =>
          prev.map((r) => (r.id === repositoryId ? body.data : r))
        )
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update repository.")
        return null
      }
    },
    [projectId]
  )

  const deleteRepository = useCallback(
    async (repositoryId: string): Promise<boolean> => {
      const previous = repositories
      setRepositories((prev) => prev.filter((r) => r.id !== repositoryId))

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        )

        if (!res.ok) {
          throw new Error("Failed to delete repository")
        }

        return true
      } catch (err) {
        setRepositories(previous)
        setError(err instanceof Error ? err.message : "Failed to delete repository.")
        return false
      }
    },
    [projectId, repositories]
  )

  return {
    repositories,
    isLoading,
    error,
    refetch,
    createRepository,
    updateRepository,
    deleteRepository,
  }
}

/**
 * Fetch a single repository by ID
 */
export function useRepository(projectId: string, repositoryId: string) {
  const [repository, setRepository] = useState<RepositoryWithMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !repositoryId) return

    let cancelled = false

    async function fetchRepository() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to load repository (${res.status})`)
        }

        const body: RepositoryResponse = await res.json()
        if (!cancelled) {
          setRepository(body.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load repository.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchRepository()
    return () => { cancelled = true }
  }, [projectId, repositoryId])

  return { repository, isLoading, error }
}

/**
 * Fetch branches for a repository
 */
export function useRepositoryBranches(projectId: string, repositoryId: string) {
  const [branches, setBranches] = useState<Array<{ name: string; isDefault: boolean; lastCommit?: string; lastCommitDate?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !repositoryId) return

    let cancelled = false

    async function fetchBranches() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}/branches`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to load branches (${res.status})`)
        }

        const body = await res.json()
        if (!cancelled) {
          setBranches(body.data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load branches.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBranches()
    return () => { cancelled = true }
  }, [projectId, repositoryId])

  return { branches, isLoading, error }
}

/**
 * Fetch commits for a repository
 */
export function useRepositoryCommits(
  projectId: string,
  repositoryId: string,
  branch?: string,
  limit?: number
) {
  const [commits, setCommits] = useState<Array<{ sha: string; message: string; author: string; date: string; url: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !repositoryId) return

    let cancelled = false

    async function fetchCommits() {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (branch) params.set("branch", branch)
        if (limit) params.set("limit", String(limit))
        if (cursor) params.set("cursor", cursor)

        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}/commits?${params}`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to load commits (${res.status})`)
        }

        const body = await res.json()
        if (!cancelled) {
          setCommits(body.data || [])
          setCursor(body.meta?.cursor || null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load commits.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchCommits()
    return () => { cancelled = true }
  }, [projectId, repositoryId, branch, limit, cursor])

  return { commits, isLoading, error, cursor, setCursor }
}

/**
 * Fetch webhooks for a repository
 */
export function useRepositoryWebhooks(projectId: string, repositoryId: string) {
  const [webhooks, setWebhooks] = useState<Array<{ id: string; event: string; url: string; enabled: boolean; createdAt: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWebhooks = useCallback(async () => {
    if (!projectId || !repositoryId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/repositories/${repositoryId}/webhooks`,
        { credentials: "include" }
      )

      if (!res.ok) {
        throw new Error(`Failed to load webhooks (${res.status})`)
      }

      const body = await res.json()
      setWebhooks(body.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhooks.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId, repositoryId])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  const createWebhook = useCallback(
    async (data: { event: string; url: string; enabled?: boolean }) => {
      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}/webhooks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
          }
        )

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to create webhook")
        }

        const body = await res.json()
        setWebhooks((prev) => [body.data, ...prev])
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create webhook.")
        return null
      }
    },
    [projectId, repositoryId]
  )

  const deleteWebhook = useCallback(
    async (webhookId: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}/webhooks/${webhookId}`,
          { method: "DELETE", credentials: "include" }
        )

        if (!res.ok) {
          throw new Error("Failed to delete webhook")
        }

        setWebhooks((prev) => prev.filter((w) => w.id !== webhookId))
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete webhook.")
        return false
      }
    },
    [projectId, repositoryId]
  )

  return { webhooks, isLoading, error, refetch: fetchWebhooks, createWebhook, deleteWebhook }
}

/**
 * Sync a repository
 */
export function useRepositorySync(projectId: string, repositoryId: string) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sync = useCallback(async () => {
    setIsSyncing(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/repositories/${repositoryId}/sync`,
        { method: "POST", credentials: "include" }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to sync repository")
      }

      const body = await res.json()
      return body.data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync repository.")
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [projectId, repositoryId])

  return { sync, isSyncing, error }
}
