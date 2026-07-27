"use client"

import { useState, useEffect, useCallback } from "react"
import type { ProjectFile, FileType, FileVisibility } from "@prisma/client"

export type FileWithMetadata = ProjectFile & {
  _count?: {
    versions: number
    shares: number
  }
}

type FilesResponse = { data: FileWithMetadata[] }
type FileResponse = { data: FileWithMetadata }

export function useProjectFiles(
  projectId: string,
  options?: {
    type?: FileType
    path?: string
    tags?: string[]
  }
) {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options?.type) params.set("type", options.type)
      if (options?.path) params.set("path", options.path)
      if (options?.tags) params.set("tags", options.tags.join(","))

      const res = await fetch(
        `/api/v1/projects/${projectId}/files?${params.toString()}`,
        {
          credentials: "include",
        }
      )

      if (!res.ok) {
        throw new Error(`Failed to load files (${res.status})`)
      }

      const body: FilesResponse = await res.json()
      setFiles(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId, options?.type, options?.path, options?.tags])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const refetch = useCallback(() => {
    fetchFiles()
  }, [fetchFiles])

  const createFile = useCallback(
    async (data: {
      name: string
      path: string
      type: FileType
      mimeType: string
      size: number
      storageId: string
      url?: string
      tags?: string[]
      metadata?: Record<string, unknown>
      visibility?: FileVisibility
    }): Promise<ProjectFile | null> => {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to create file")
        }

        const body: FileResponse = await res.json()
        setFiles((prev) => [body.data, ...prev])
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create file.")
        return null
      }
    },
    [projectId]
  )

  const updateFile = useCallback(
    async (
      fileId: string,
      data: {
        name?: string
        path?: string
        type?: FileType
        tags?: string[]
        metadata?: Record<string, unknown>
        visibility?: FileVisibility
      }
    ): Promise<ProjectFile | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/files/${fileId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
          }
        )

        if (!res.ok) {
          throw new Error("Failed to update file")
        }

        const body: FileResponse = await res.json()
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? body.data : f))
        )
        return body.data
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update file.")
        return null
      }
    },
    [projectId]
  )

  const deleteFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      const previous = files
      setFiles((prev) => prev.filter((f) => f.id !== fileId))

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/files/${fileId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        )

        if (!res.ok) {
          throw new Error("Failed to delete file")
        }

        return true
      } catch (err) {
        setFiles(previous)
        setError(err instanceof Error ? err.message : "Failed to delete file.")
        return false
      }
    },
    [projectId, files]
  )

  return {
    files,
    isLoading,
    error,
    refetch,
    createFile,
    updateFile,
    deleteFile,
  }
}

/**
 * Fetch a single file by ID (with versions)
 */
export function useFile(projectId: string, fileId: string) {
  const [file, setFile] = useState<FileWithMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !fileId) return

    let cancelled = false

    async function fetchFile() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/files/${fileId}`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to load file (${res.status})`)
        }

        const body: FileResponse = await res.json()
        if (!cancelled) {
          setFile(body.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load file.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchFile()
    return () => { cancelled = true }
  }, [projectId, fileId])

  return { file, isLoading, error }
}
