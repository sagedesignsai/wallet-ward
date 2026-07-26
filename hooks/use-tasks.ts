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

  const getTask = useCallback(
    async (taskId: string): Promise<Task | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
          { credentials: "include" }
        )
        if (!res.ok) {
          throw new Error(`Failed to load task (${res.status})`)
        }
        const body: TaskResponse = await res.json()
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load task.")
        return null
      }
    },
    [projectId]
  )

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

  const updateTask = useCallback(
    async (
      taskId: string,
      input: {
        title?: string
        description?: string | null
        status?: Task["status"]
        assigneeId?: string | null
      }
    ): Promise<Task | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
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

  const updateTaskStatus = useCallback(
    async (taskId: string, status: Task["status"]): Promise<Task | null> => {
      return updateTask(taskId, { status })
    },
    [updateTask]
  )

  const deleteTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
          { method: "DELETE", credentials: "include" }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to delete task (${res.status})`
          )
        }
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete task."
        )
        return false
      }
    },
    [projectId]
  )

  return {
    tasks,
    isLoading,
    error,
    refetch,
    getTask,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  }
}

/** Fetch a single task without requiring the full list hook. */
export function useTask(projectId: string, taskId: string | undefined) {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`Failed to load task (${res.status})`)
      const body: TaskResponse = await res.json()
      setTask(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task.")
      setTask(null)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, taskId])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  const save = useCallback(
    async (input: {
      title?: string
      description?: string | null
      status?: Task["status"]
      assigneeId?: string | null
    }) => {
      if (!taskId) return null
      setIsSaving(true)
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to update task (${res.status})`
          )
        }
        const body: TaskResponse = await res.json()
        setTask(body.data)
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update task.")
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [projectId, taskId]
  )

  const remove = useCallback(async () => {
    if (!taskId) return false
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
        { method: "DELETE", credentials: "include" }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(
          body?.error?.message ?? `Failed to delete task (${res.status})`
        )
      }
      setTask(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.")
      return false
    }
  }, [projectId, taskId])

  return {
    task,
    isLoading,
    isSaving,
    error,
    refetch: fetchTask,
    save,
    remove,
  }
}
