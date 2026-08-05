"use client"

import { useState, useEffect, useCallback } from "react"
import type { ProjectFile, FileType, FileVisibility } from "@prisma/client"
import { apiErrorMessage } from "@/lib/utils"

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
        setFiles((prev) => prev.map((f) => (f.id === fileId ? body.data : f)))
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

  /**
   * Two-step presigned upload helper.
   *
   * 1. Calls POST /files/presign  → gets { uploadUrl, storageKey }
   * 2. PUTs the file bytes directly to R2 via XHR (supports progress events)
   * 3. Calls POST /files/confirm  → writes the ProjectFile DB record
   *
   * @param file       - The File object to upload
   * @param meta       - Metadata for the ProjectFile record
   * @param onProgress - Optional progress callback (0–100)
   */
  const presignAndUpload = useCallback(
    async (
      file: File,
      meta: {
        name?: string
        path?: string
        type?: FileType
        tags?: string[]
        visibility?: FileVisibility
        parentId?: string
      },
      onProgress?: (pct: number) => void
    ): Promise<ProjectFile | null> => {
      try {
        // Step 1: Get presigned PUT URL from the server
        const presignRes = await fetch(
          `/api/v1/projects/${projectId}/files/presign`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
            }),
          }
        )

        if (!presignRes.ok) {
          const body = await presignRes.json().catch(() => null)
          throw new Error(apiErrorMessage(body, "Failed to get upload URL"))
        }

        const { data: presignData } = await presignRes.json()
        const { uploadUrl, storageKey } = presignData

        // Step 2: PUT file bytes directly to R2 (bypasses Next.js server)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          if (onProgress) {
            xhr.upload.addEventListener("progress", (ev) => {
              if (ev.lengthComputable) {
                onProgress(Math.round((ev.loaded / ev.total) * 100))
              }
            })
          }

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Storage upload failed (HTTP ${xhr.status})`))
            }
          })

          xhr.addEventListener("error", () =>
            reject(new Error("Network error during upload"))
          )

          xhr.open("PUT", uploadUrl)
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
          )
          xhr.send(file)
        })

        onProgress?.(100)

        // Step 3: Confirm — server verifies object exists in R2 and writes DB
        const confirmRes = await fetch(
          `/api/v1/projects/${projectId}/files/confirm`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storageKey,
              name: meta.name ?? file.name,
              path: meta.path ?? `/${file.name}`,
              type: meta.type ?? "other",
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              tags: meta.tags ?? [],
              visibility: meta.visibility ?? "private",
              ...(meta.parentId ? { parentId: meta.parentId } : {}),
            }),
          }
        )

        if (!confirmRes.ok) {
          const body = await confirmRes.json().catch(() => null)
          throw new Error(apiErrorMessage(body, "Failed to save file record"))
        }

        const { data: newFile }: FileResponse = await confirmRes.json()
        setFiles((prev) => [newFile, ...prev])
        return newFile
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file.")
        return null
      }
    },
    [projectId]
  )

  return {
    files,
    isLoading,
    error,
    refetch,
    updateFile,
    deleteFile,
    presignAndUpload,
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
    return () => {
      cancelled = true
    }
  }, [projectId, fileId])

  return { file, isLoading, error }
}
