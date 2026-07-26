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

  const getDocument = useCallback(
    async (documentId: string): Promise<Document | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
          { credentials: "include" }
        )
        if (!res.ok) {
          throw new Error(`Failed to load document (${res.status})`)
        }
        const body: DocumentResponse = await res.json()
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document."
        )
        return null
      }
    },
    [projectId]
  )

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

  const updateDocument = useCallback(
    async (
      documentId: string,
      input: { title?: string; content?: string | null }
    ): Promise<Document | null> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
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
            body?.error?.message ?? `Failed to update document (${res.status})`
          )
        }
        const body: DocumentResponse = await res.json()
        setDocuments((prev) =>
          prev.map((d) => (d.id === documentId ? body.data : d))
        )
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update document."
        )
        return null
      }
    },
    [projectId]
  )

  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
          { method: "DELETE", credentials: "include" }
        )
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ?? `Failed to delete document (${res.status})`
          )
        }
        setDocuments((prev) => prev.filter((d) => d.id !== documentId))
        return true
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete document."
        )
        return false
      }
    },
    [projectId]
  )

  return {
    documents,
    isLoading,
    error,
    refetch,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
  }
}

/** Fetch a single document without requiring the full list hook. */
export function useDocument(projectId: string, documentId: string | undefined) {
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`Failed to load document (${res.status})`)
      const body: DocumentResponse = await res.json()
      setDocument(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document.")
      setDocument(null)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  const save = useCallback(
    async (input: { title?: string; content?: string | null }) => {
      if (!documentId) return null
      setIsSaving(true)
      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
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
            body?.error?.message ?? `Failed to update document (${res.status})`
          )
        }
        const body: DocumentResponse = await res.json()
        setDocument(body.data)
        return body.data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update document."
        )
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [projectId, documentId]
  )

  const remove = useCallback(async () => {
    if (!documentId) return false
    try {
      const res = await fetch(
        `/api/v1/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
        { method: "DELETE", credentials: "include" }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(
          body?.error?.message ?? `Failed to delete document (${res.status})`
        )
      }
      setDocument(null)
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document."
      )
      return false
    }
  }, [projectId, documentId])

  return {
    document,
    isLoading,
    isSaving,
    error,
    refetch: fetchDocument,
    save,
    remove,
  }
}
