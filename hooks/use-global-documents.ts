"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export type GlobalDocument = {
  id: string
  projectId: string
  title: string
  content: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
  project: { id: string; name: string; slug: string }
  createdBy: { id: string; name: string; email: string } | null
}

type DocumentsResponse = { data: GlobalDocument[] }

export type GlobalDocumentFilters = {
  projectId: string | null
  search: string
}

export function useGlobalDocuments() {
  const [documents, setDocuments] = useState<GlobalDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<GlobalDocumentFilters>({
    projectId: null,
    search: "",
  })

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/v1/documents", { credentials: "include" })

      if (!res.ok) {
        throw new Error(`Failed to load documents (${res.status})`)
      }

      const body: DocumentsResponse = await res.json()
      setDocuments(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const refetch = useCallback(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const setFilter = useCallback(
    (key: keyof GlobalDocumentFilters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters({ projectId: null, search: "" })
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.projectId) count++
    if (filters.search.trim()) count++
    return count
  }, [filters])

  const filtered = useMemo(() => {
    let result = documents

    if (filters.projectId) {
      result = result.filter((d) => d.projectId === filters.projectId)
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.content && d.content.toLowerCase().includes(q))
      )
    }

    return result
  }, [documents, filters])

  const projects = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; slug: string }
    >()
    for (const d of documents) {
      if (!map.has(d.projectId)) {
        map.set(d.projectId, d.project)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [documents])

  return {
    documents,
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
