"use client"

import { useState, useEffect, useCallback } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrgDetail = {
  id: string
  name: string
  slug: string
  logo: string | null
  metadata: unknown
  createdAt: string
  updatedAt: string
  memberCount: number
  projectCount: number
  auditLogCount: number
}

type OrgDetailResponse = { data: OrgDetail }

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrgDetail(orgId: string) {
  const [organization, setOrganization] = useState<OrgDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganization = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/v1/organizations/${encodeURIComponent(orgId)}`,
        { credentials: "include" }
      )

      if (!res.ok) {
        throw new Error(`Failed to load organization (${res.status})`)
      }

      const body: OrgDetailResponse = await res.json()
      setOrganization(body.data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load organization."
      )
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  const updateOrganization = useCallback(
    async (input: {
      name?: string
      logo?: string | null
    }): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/v1/organizations/${encodeURIComponent(orgId)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        )

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ??
              `Failed to update organization (${res.status})`
          )
        }

        const body: OrgDetailResponse = await res.json()

        setOrganization((prev) =>
          prev
            ? { ...prev, ...body.data, memberCount: prev.memberCount, projectCount: prev.projectCount, auditLogCount: prev.auditLogCount }
            : prev
        )

        return true
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update organization."
        )
        return false
      }
    },
    [orgId]
  )

  const deleteOrganization = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/v1/organizations/${encodeURIComponent(orgId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(
          body?.error?.message ??
            `Failed to delete organization (${res.status})`
        )
      }

      setOrganization(null)
      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete organization."
      )
      return false
    }
  }, [orgId])

  const refetch = useCallback(() => {
    fetchOrganization()
  }, [fetchOrganization])

  return {
    organization,
    isLoading,
    error,
    updateOrganization,
    deleteOrganization,
    refetch,
  }
}
