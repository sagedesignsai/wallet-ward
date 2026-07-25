"use client"

import { useState, useEffect, useCallback } from "react"

export type Document = {
  id: string
  projectId: string
  title: string
  content: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string; email: string } | null
}

type DocumentsResponse = { data: Document[] }
type DocumentResponse = { data: Document }

export function useDocuments(projectId: string) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/documents`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`Failed to load documents (${res.status})`)
      const body: DocumentsResponse = await res.json()
      setDocuments(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const refetch = useCallback(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const createDocument = useCallback(
    async (input: {
      title: string
      content?: string
    }): Promise<Document | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/documents`,
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
            body?.error?.message ?? `Failed to create document (${res.status})`
          )
        }
        const body: DocumentResponse = await res.json()
        setDocuments((prev) => [body.data, ...prev])
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create document."
        )
        return null
      }
    },
    [projectId]
  )

  return { documents, isLoading, error, refetch, createDocument }
}
