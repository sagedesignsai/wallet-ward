"use client"

import { useState, useEffect, useCallback } from "react"
import { authClient } from "@/lib/auth-client"

type Session = {
  id: string
  token: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  expiresAt: string
}

export function useSessions(currentSessionId?: string) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await authClient.listSessions()
      if (res.error) {
        setSessions([])
      } else {
        // Map Better Auth response to our Session type
        // Better Auth returns Date objects, we need strings
        const data = (res.data ?? []) as unknown as Array<{
          id: string
          token: string
          ipAddress?: string | null
          userAgent?: string | null
          createdAt: Date | string
          expiresAt: Date | string
        }>
        setSessions(
          data.map((s) => ({
            id: s.id,
            token: s.token,
            ipAddress: s.ipAddress ?? null,
            userAgent: s.userAgent ?? null,
            createdAt: typeof s.createdAt === "string" ? s.createdAt : s.createdAt.toISOString(),
            expiresAt: typeof s.expiresAt === "string" ? s.expiresAt : s.expiresAt.toISOString(),
          }))
        )
      }
    } catch {
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const revokeSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      // Find the session token for this ID
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      try {
        const res = await authClient.revokeSession({ token: session.token })
        if (res.error) {
          return false
        }
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        return true
      } catch {
        return false
      }
    },
    [sessions]
  )

  const revokeAllOther = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authClient.revokeOtherSessions()
      if (res.error) {
        return false
      }
      // Keep only the current session
      setSessions((prev) =>
        currentSessionId
          ? prev.filter((s) => s.id === currentSessionId)
          : []
      )
      return true
    } catch {
      return false
    }
  }, [currentSessionId])

  return {
    sessions,
    isLoading,
    currentSessionId: currentSessionId ?? "",
    revokeSession,
    revokeAllOther,
    refetch: fetchSessions,
  }
}
