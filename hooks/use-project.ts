"use client"

import { useState, useEffect, useCallback } from "react"
import type { Project } from "@/hooks/use-projects"

type ProjectResponse = { data: Project }

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}`,
        { credentials: "include" }
      )

      if (!res.ok) {
        throw new Error(`Failed to load project (${res.status})`)
      }

      const body: ProjectResponse = await res.json()
      setProject(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const refetch = useCallback(() => {
    fetchProject()
  }, [fetchProject])

  const updateProject = useCallback(
    async (input: {
      name?: string
      description?: string | null
    }): Promise<Project | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}`,
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
            body?.error?.message ?? `Failed to update project (${res.status})`
          )
        }

        const body: ProjectResponse = await res.json()
        setProject(body.data)
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update project."
        )
        return null
      }
    },
    [projectId]
  )

  const deleteProject = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!res.ok) {
        throw new Error(`Failed to delete project (${res.status})`)
      }

      setProject(null)
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete project."
      )
      return false
    }
  }, [projectId])

  return {
    project,
    isLoading,
    error,
    refetch,
    updateProject,
    deleteProject,
  }
}
