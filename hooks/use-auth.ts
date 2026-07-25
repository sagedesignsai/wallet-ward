"use client"

import { authClient, useSession, signIn, signUp, signOut } from "@/lib/auth-client"

export function useAuth() {
  const sessionState = useSession()

  return {
    session: sessionState.data?.session ?? null,
    user: sessionState.data?.user ?? null,
    isPending: sessionState.isPending,
    error: sessionState.error,
    isAuthenticated: !!sessionState.data?.user,
    signIn,
    signUp,
    signOut,
    authClient,
  }
}
