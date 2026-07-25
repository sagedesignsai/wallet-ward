"use client"

import { useState, useEffect, useCallback } from "react"

export type Member = {
  id: string
  userId: string
  organizationId: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export type Invitation = {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
  organizationId: string
}

export function useMembers(organizationId: string | null) {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([])
      setInvitations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch(
          `/api/auth/api/organization/list-members?organizationId=${encodeURIComponent(organizationId)}`,
          { credentials: "include" }
        ),
        fetch(
          `/api/auth/api/organization/list-invitations?organizationId=${encodeURIComponent(organizationId)}`,
          { credentials: "include" }
        ),
      ])

      const membersBody = membersRes.ok ? await membersRes.json() : { data: [] }
      const invitationsBody = invitationsRes.ok ? await invitationsRes.json() : { data: [] }

      // Better Auth returns { data: { members: [...] } } or { data: [...] }
      const membersData = membersBody?.data
      setMembers(
        Array.isArray(membersData?.members)
          ? (membersData.members as Member[])
          : Array.isArray(membersData)
            ? (membersData as Member[])
            : []
      )

      const invitationsData = invitationsBody?.data
      setInvitations(
        Array.isArray(invitationsData?.invitations)
          ? (invitationsData.invitations as Invitation[])
          : Array.isArray(invitationsData)
            ? (invitationsData as Invitation[])
            : []
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load team members."
      )
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const invite = useCallback(
    async (input: {
      email: string
      role: string
    }): Promise<Invitation | null> => {
      if (!organizationId) return null

      try {
        const res = await fetch("/api/auth/api/organization/invite-member", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: input.email,
            role: input.role,
            organizationId,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.message ?? "Failed to send invitation")
        }

        const body = await res.json()
        const invitation = (body?.data ?? body) as Invitation
        if (invitation) {
          setInvitations((prev) => [...prev, invitation])
        }
        return invitation
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send invitation."
        )
        return null
      }
    },
    [organizationId]
  )

  const removeMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      if (!organizationId) return false

      // Optimistic removal
      let previous: Member[] = []
      setMembers((prev) => {
        previous = prev
        return prev.filter((m) => m.id !== memberId)
      })

      try {
        const res = await fetch("/api/auth/api/organization/remove-member", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberIdOrEmail: memberId,
            organizationId,
          }),
        })

        if (!res.ok) {
          throw new Error("Failed to remove member")
        }

        return true
      } catch (err) {
        setMembers(previous)
        setError(
          err instanceof Error ? err.message : "Failed to remove member."
        )
        return false
      }
    },
    [organizationId]
  )

  const updateRole = useCallback(
    async (memberId: string, role: string): Promise<boolean> => {
      if (!organizationId) return false

      // Optimistic update
      let previous: Member[] = []
      setMembers((prev) => {
        previous = prev
        return prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      })

      try {
        const res = await fetch("/api/auth/api/organization/update-member-role", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId,
            role,
            organizationId,
          }),
        })

        if (!res.ok) {
          throw new Error("Failed to update role")
        }

        return true
      } catch (err) {
        setMembers(previous)
        setError(
          err instanceof Error ? err.message : "Failed to update role."
        )
        return false
      }
    },
    [organizationId]
  )

  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      if (!organizationId) return false

      let previous: Invitation[] = []
      setInvitations((prev) => {
        previous = prev
        return prev.filter((i) => i.id !== invitationId)
      })

      try {
        const res = await fetch("/api/auth/api/organization/reject-invitation", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId }),
        })

        if (!res.ok) {
          throw new Error("Failed to cancel invitation")
        }

        return true
      } catch (err) {
        setInvitations(previous)
        setError(
          err instanceof Error ? err.message : "Failed to cancel invitation."
        )
        return false
      }
    },
    [organizationId]
  )

  const refetch = useCallback(() => {
    fetchMembers()
  }, [fetchMembers])

  return {
    members,
    invitations,
    isLoading,
    error,
    invite,
    removeMember,
    updateRole,
    cancelInvitation,
    refetch,
  }
}
