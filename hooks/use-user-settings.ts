"use client"

import { useState, useCallback } from "react"
import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/hooks/use-auth"

export function useUserSettings() {
  const { user, isPending: isLoading } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  const updateProfile = useCallback(
    async (input: { name?: string; image?: string }): Promise<boolean> => {
      setIsUpdating(true)
      try {
        const res = await authClient.updateUser(input)
        if (res.error) {
          return false
        }
        return true
      } catch {
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  const changePassword = useCallback(
    async (input: {
      currentPassword: string
      newPassword: string
    }): Promise<{ success: boolean; error?: string }> => {
      setIsUpdating(true)
      try {
        const res = await authClient.changePassword(input)
        if (res.error) {
          return { success: false, error: res.error.message || "Failed to change password" }
        }
        return { success: true }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred"
        return { success: false, error: msg }
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  return {
    user,
    isUpdating,
    updateProfile,
    changePassword,
    isLoading,
  }
}
