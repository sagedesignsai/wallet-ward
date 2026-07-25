"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export type GlobalTask = {
  id: string
  projectId: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "done"
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  project: { id: string; name: string; slug: string }
  assignee: { id: string; name: string; email: string } | null
}

type TasksResponse = { data: GlobalTask[] }

export type GlobalTaskFilters = {
  projectId: string | null
  status: string | null
  search: string
}

export function useGlobalTasks() {
  const [tasks, setTasks] = useState<GlobalTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<GlobalTaskFilters>({
    projectId: null,
    status: null,
    search: "",
  })

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/v1/tasks", { credentials: "include" })

      if (!res.ok) {
        throw new Error(`Failed to load tasks (${res.status})`)
      }

      const body: TasksResponse = await res.json()
      setTasks(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const refetch = useCallback(() => {
    fetchTasks()
  }, [fetchTasks])

  const setFilter = useCallback(
    (key: keyof GlobalTaskFilters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({ projectId: null, status: null, search: "" })
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.projectId) count++
    if (filters.status) count++
    if (filters.search.trim()) count++
    return count
  }, [filters])

  const filtered = useMemo(() => {
    let result = tasks

    if (filters.projectId) {
      result = result.filter((t) => t.projectId === filters.projectId)
    }

    if (filters.status) {
      result = result.filter((t) => t.status === filters.status)
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
    }

    return result
  }, [tasks, filters])

  const projects = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; slug: string }
    >()
    for (const t of tasks) {
      if (!map.has(t.projectId)) {
        map.set(t.projectId, t.project)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [tasks])

  return {
    tasks,
    filtered,
    isLoading,
    error,
    filters,
    activeFilterCount,
    projects,
    setFilter,
    clearFilters,
    refetch,
  }
}
