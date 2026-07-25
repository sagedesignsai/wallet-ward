"use client"

import { useState, useEffect, useCallback } from "react"

export type Organization = {
  id: string
  name: string
  slug: string
  logo: string | null
  role: string
  createdAt: string
}

type OrganizationsResponse = {
  data: Organization[]
  activeOrganizationId: string
}

export function useOrganization() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/v1/organizations", {
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error(`Failed to load organizations (${res.status})`)
      }

      const body: OrganizationsResponse = await res.json()
      setOrganizations(body.data)
      setActiveOrganizationId(body.activeOrganizationId)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load organizations."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const createOrganization = useCallback(
    async (input: { name: string }): Promise<Organization | null> => {
      try {
        const res = await fetch("/api/v1/organizations", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to create organization (${res.status})`
          )
        }

        const body: { data: Organization } = await res.json()
        setOrganizations((prev) => [...prev, body.data])
        return body.data
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create organization."
        )
        return null
      }
    },
    []
  )

  const switchOrganization = useCallback(
    async (orgId: string) => {
      try {
        const res = await fetch("/api/auth/organization/set-active", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: orgId }),
        })

        if (!res.ok) {
          throw new Error("Failed to switch organization")
        }

        setActiveOrganizationId(orgId)
        // Refetch to get updated active org state
        await fetchOrganizations()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to switch organization."
        )
      }
    },
    [fetchOrganizations]
  )

  const refetch = useCallback(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  return {
    organizations,
    activeOrganizationId,
    activeOrganization: organizations.find((o) => o.id === activeOrganizationId) ?? null,
    isLoading,
    error,
    createOrganization,
    switchOrganization,
    refetch,
  }
}
