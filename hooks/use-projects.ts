"use client"

import { useState, useEffect, useCallback } from "react"

export type ProjectEnvironment = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: string
  organizationId: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  environments: ProjectEnvironment[]
}

type ProjectsResponse = {
  data: Project[]
}

type ProjectResponse = {
  data: Project
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)

  // Resolve the active organization on mount via our own API
  useEffect(() => {
    let cancelled = false

    async function resolveOrg() {
      try {
        const res = await fetch("/api/v1/organizations", { credentials: "include" })
        if (cancelled) return

        if (!res.ok) throw new Error("Failed to load organizations")
        const body = await res.json()

        const activeId: string | null = body.activeOrganizationId ?? null
        if (activeId) {
          setOrgId(activeId)
        } else if (body.data?.length > 0) {
          setOrgId(body.data[0].id)
        } else {
          setError("No active organization found.")
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load organization.")
          setIsLoading(false)
        }
      }
    }

    resolveOrg()
    return () => { cancelled = true }
  }, [])

  // Fetch projects when org ID is available
  const fetchProjects = useCallback(async () => {
    if (!orgId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/v1/projects?organizationId=${encodeURIComponent(orgId)}`,
        { credentials: "include" }
      )

      if (!res.ok) {
        throw new Error(`Failed to load projects (${res.status})`)
      }

      const body: ProjectsResponse = await res.json()
      setProjects(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.")
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const refetch = useCallback(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = useCallback(
    async (input: {
      name: string
      slug?: string
      description?: string
    }): Promise<Project | null> => {
      if (!orgId) return null

      try {
        const res = await fetch("/api/v1/projects", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, organizationId: orgId }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error?.message ?? `Failed to create project (${res.status})`)
        }

        const body: ProjectResponse = await res.json()
        setProjects((prev) => [...prev, body.data])
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create project.")
        return null
      }
    },
    [orgId]
  )

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic removal
      let previous: Project[] = []
      setProjects((prev) => {
        previous = prev
        return prev.filter((p) => p.id !== id)
      })

      try {
        const res = await fetch(`/api/v1/projects/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (!res.ok) {
          throw new Error(`Failed to delete project (${res.status})`)
        }

        return true
      } catch (err) {
        // Rollback on failure
        setProjects(previous)
        setError(err instanceof Error ? err.message : "Failed to delete project.")
        return false
      }
    },
    []
  )

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject,
    deleteProject,
  }
}
