"use client"

import { useState, useEffect, useCallback } from "react"

export type Task = {
  id: string
  projectId: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "done"
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  assignee: { id: string; name: string; email: string } | null
}

type TasksResponse = { data: Task[] }
type TaskResponse = { data: Task }

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/tasks`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`)
      const body: TasksResponse = await res.json()
      setTasks(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const refetch = useCallback(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(
    async (input: {
      title: string
      description?: string
      assigneeId?: string
    }): Promise<Task | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/tasks`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to create task (${res.status})`
          )
        }
        const body: TaskResponse = await res.json()
        setTasks((prev) => [body.data, ...prev])
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create task."
        )
        return null
      }
    },
    [projectId]
  )

  const updateTaskStatus = useCallback(
    async (taskId: string, status: Task["status"]): Promise<Task | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to update task (${res.status})`
          )
        }
        const body: TaskResponse = await res.json()
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? body.data : t))
        )
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update task."
        )
        return null
      }
    },
    [projectId]
  )

  return { tasks, isLoading, error, refetch, createTask, updateTaskStatus }
}
