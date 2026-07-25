"use client"

import { useState, useEffect, useCallback } from "react"
import { authClient } from "@/lib/auth-client"

type ApiKey = {
  id: string
  name: string | null
  start: string | null
  enabled: boolean
  expiresAt: string | null
  createdAt: string
  lastRequest: string | null
  requestCount: number
  remaining: number | null
  refillAmount: number | null
  refillInterval: number | null
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await (authClient.apiKey as any).list()
      if (res.error) {
        setError(res.error.message || "Failed to load API keys")
        setKeys([])
      } else {
        setKeys(res.data ?? [])
      }
    } catch {
      setError("Failed to load API keys")
      setKeys([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const createKey = useCallback(
    async (input: {
      name: string
      expiresIn?: number
    }): Promise<{ key: string } | null> => {
      try {
        const res = await (authClient.apiKey as any).create({
          name: input.name,
          expiresIn: input.expiresIn,
        })
        if (res.error) {
          return null
        }
        await fetchKeys()
        return { key: res.data?.key ?? "" }
      } catch {
        return null
      }
    },
    [fetchKeys]
  )

  const deleteKey = useCallback(
    async (keyId: string): Promise<boolean> => {
      try {
        const res = await (authClient.apiKey as any).delete({ keyId })
        if (res.error) {
          return false
        }
        setKeys((prev) => prev.filter((k) => k.id !== keyId))
        return true
      } catch {
        return false
      }
    },
    []
  )

  const toggleKey = useCallback(
    async (keyId: string, enabled: boolean): Promise<boolean> => {
      try {
        const res = await (authClient.apiKey as any).update({
          keyId,
          enabled,
        })
        if (res.error) {
          return false
        }
        setKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, enabled } : k))
        )
        return true
      } catch {
        return false
      }
    },
    []
  )

  return {
    keys,
    isLoading,
    error,
    createKey,
    deleteKey,
    toggleKey,
    refetch: fetchKeys,
  }
}
