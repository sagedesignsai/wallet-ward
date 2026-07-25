"use client"

import { useState, useEffect, useCallback } from "react"

export type Secret = {
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
}

export type SecretWithValue = {
  secret: Secret
  version: number
  value: string
}

type SecretsResponse = { data: Secret[] }
type SecretResponse = { data: Secret }
type SecretValueResponse = { data: SecretWithValue }

export function useSecrets(projectId: string, environmentId: string) {
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revealCache, setRevealCache] = useState<
    Record<string, SecretWithValue>
  >({})

  const fetchSecrets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/environments/${encodeURIComponent(environmentId)}/secrets`,
        { credentials: "include" }
      )

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
  }, [projectId, environmentId])

  useEffect(() => {
    fetchSecrets()
  }, [fetchSecrets])

  const refetch = useCallback(() => {
    fetchSecrets()
  }, [fetchSecrets])

  const createSecret = useCallback(
    async (input: {
      name: string
      value: string
      description?: string
      type?: string
    }): Promise<Secret | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/environments/${encodeURIComponent(environmentId)}/secrets`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        )

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to create secret (${res.status})`
          )
        }

        const body: SecretResponse = await res.json()
        setSecrets((prev) => [body.data, ...prev])
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create secret."
        )
        return null
      }
    },
    [projectId, environmentId]
  )

  const deleteSecret = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic removal
      let previous: Secret[] = []
      setSecrets((prev) => {
        previous = prev
        return prev.filter((s) => s.id !== id)
      })

      try {
        const res = await fetch(
          `/api/v1/secrets/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        )

        if (!res.ok) {
          throw new Error(`Failed to delete secret (${res.status})`)
        }

        // Remove from reveal cache too
        setRevealCache((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })

        return true
      } catch (err) {
        // Rollback on failure
        setSecrets(previous)
        setError(
          err instanceof Error ? err.message : "Failed to delete secret."
        )
        return false
      }
    },
    []
  )

  const revealValue = useCallback(
    async (secretId: string): Promise<SecretWithValue | null> => {
      // Return cached value if available
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

  return {
    secrets,
    isLoading,
    error,
    refetch,
    createSecret,
    deleteSecret,
    revealValue,
  }
}
