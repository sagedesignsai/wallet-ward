"use client"

import { useState } from "react"
import { twoFactor } from "@/lib/auth-client"

export interface EnableTwoFactorResult {
  totpURI?: string
  backupCodes?: string[]
}

export function useTwoFactor() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enableTwoFactor = async (password: string): Promise<EnableTwoFactorResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await twoFactor.enable({
        password,
      })

      if (res.error) {
        setError(res.error.message || "Failed to enable two-factor authentication")
        return null
      }

      return {
        totpURI: res.data?.totpURI,
        backupCodes: res.data?.backupCodes,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const verifyTotp = async (code: string, trustDevice: boolean = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await twoFactor.verifyTotp({
        code,
        trustDevice,
      })

      if (res.error) {
        setError(res.error.message || "Invalid verification code")
        return { success: false, error: res.error.message }
      }

      return { success: true, data: res.data }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify code"
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyBackupCode = async (code: string, trustDevice: boolean = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await twoFactor.verifyBackupCode({
        code,
        trustDevice,
      })

      if (res.error) {
        setError(res.error.message || "Invalid backup code")
        return { success: false, error: res.error.message }
      }

      return { success: true, data: res.data }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify backup code"
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  const disableTwoFactor = async (password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await twoFactor.disable({
        password,
      })

      if (res.error) {
        setError(res.error.message || "Failed to disable two-factor authentication")
        return { success: false, error: res.error.message }
      }

      return { success: true, data: res.data }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  const generateBackupCodes = async (password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await twoFactor.generateBackupCodes({
        password,
      })

      if (res.error) {
        setError(res.error.message || "Failed to generate backup codes")
        return { success: false, error: res.error.message }
      }

      return { success: true, backupCodes: res.data?.backupCodes }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    setError,
    enableTwoFactor,
    verifyTotp,
    verifyBackupCode,
    disableTwoFactor,
    generateBackupCodes,
  }
}
