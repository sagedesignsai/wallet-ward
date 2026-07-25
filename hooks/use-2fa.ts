"use client"

import { useState, useCallback } from "react"
import { authClient } from "@/lib/auth-client"

export function use2FA(initialEnabled: boolean = false) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [isPending, setIsPending] = useState(false)
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const enable2FA = useCallback(
    async (
      password: string
    ): Promise<{ totpUri?: string; backupCodes?: string[]; error?: string }> => {
      setIsPending(true)
      try {
        const res = await authClient.twoFactor.enable({ password })

        if (res.error) {
          const msg = res.error.message || "Failed to enable two-factor authentication"
          return { error: msg }
        }

        const data = res.data as { totpURI?: string; backupCodes?: string[] } | undefined
        if (data?.totpURI) setTotpUri(data.totpURI)
        if (data?.backupCodes) setBackupCodes(data.backupCodes)
        setIsEnabled(true)

        return {
          totpUri: data?.totpURI,
          backupCodes: data?.backupCodes,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred"
        return { error: msg }
      } finally {
        setIsPending(false)
      }
    },
    []
  )

  const disable2FA = useCallback(
    async (
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsPending(true)
      try {
        const res = await authClient.twoFactor.disable({ password })

        if (res.error) {
          return {
            success: false,
            error: res.error.message || "Failed to disable two-factor authentication",
          }
        }

        setIsEnabled(false)
        setTotpUri(null)
        setBackupCodes([])
        return { success: true }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred"
        return { success: false, error: msg }
      } finally {
        setIsPending(false)
      }
    },
    []
  )

  return {
    isEnabled,
    isPending,
    totpUri,
    backupCodes,
    enable2FA,
    disable2FA,
  }
}
