"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import {
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import {
  useGlobalDocuments,
  type GlobalDocument,
} from "@/hooks/use-global-documents"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function GlobalDocumentsPage() {
  const { setConfig } = useDashboardConfig()
  const {
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
  } = useGlobalDocuments()

  useEffect(() => {
    setConfig({
      title: "Documents",
      description: "All documents across your projects",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Documents" },
      ],
    })
  }, [setConfig])

  const distinctProjects = useMemo(() => {
    const set = new Set<string>()
    for (const d of documents) set.add(d.projectId)
    return set.size
  }, [documents])

  const columns: DataTableColumn<GlobalDocument & Record<string, unknown>>[] =
    useMemo(
      () => [
        {
          key: "title",
          header: "Document",
          className: "w-[320px]",
          render: (row) => {
            const doc = row as unknown as GlobalDocument
            return (
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
                  <FileTextIcon className="size-3" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-foreground truncate block">
                    {doc.title}
                  </span>
                  {doc.content && (
                    <span className="text-[0.625rem] text-muted-foreground truncate block">
                      {doc.content.slice(0, 80).replace(/[#*_`~\[\]]/g, "")}
                    </span>
                  )}
                </div>
              </div>
            )
          },
        },
        {
          key: "project",
          header: "Project",
          className: "w-[160px]",
          render: (row) => {
            const doc = row as unknown as GlobalDocument
            return (
              <Link
                href={`/dashboard/projects/${doc.projectId}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderIcon className="size-3 shrink-0" />
                <span className="truncate">{doc.project.name}</span>
              </Link>
            )
          },
        },
        {
          key: "createdBy",
          header: "Author",
          className: "w-[140px]",
          render: (row) => {
            const doc = row as unknown as GlobalDocument
            return doc.createdBy ? (
              <span className="text-xs text-muted-foreground">
                {doc.createdBy.name}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )
          },
        },
        {
          key: "updatedAt",
          header: "Updated",
          className: "w-[100px]",
          render: (row) => {
            const doc = row as unknown as GlobalDocument
            return <TimeAgo date={doc.updatedAt} />
          },
        },
      ],
      []
    )

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button
            onClick={refetch}
            className="ml-2 font-medium underline underline-offset-2 hover:text-destructive/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Documents"
          value={isLoading ? "—" : documents.length}
          icon={<FileTextIcon className="size-4" />}
          description="Across all projects"
        />
        <StatCard
          label="Projects"
          value={isLoading ? "—" : distinctProjects}
          icon={<FolderIcon className="size-4" />}
          description={
            distinctProjects === 1 ? "1 project" : `${distinctProjects} projects`
          }
        />
      </div>

      {/* Search + Table */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search documents..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="max-w-xs h-8 text-xs"
          />
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {!isLoading && documents.length === 0 && !error ? (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
            <div className="flex flex-col items-center gap-4 py-12 px-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary ring-1 ring-primary/10 transition-transform hover:scale-105">
                <FolderOpenIcon className="size-7" weight="light" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-foreground">
                  No documents yet
                </h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Create your first document within a project to get started.
                </p>
              </div>
              <Link href="/dashboard/projects">
                <Button
                  size="default"
                  className="shadow-md shadow-primary/10 transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  <FolderIcon />
                  Go to Projects
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <DataTable
            columns={
              columns as DataTableColumn<Record<string, unknown>>[]
            }
            data={filtered as (GlobalDocument & Record<string, unknown>)[]}
            isLoading={isLoading}
            loadingRows={5}
            keyExtractor={(d) => String((d as unknown as GlobalDocument).id)}
            onRowClick={(row) => {
              const doc = row as unknown as GlobalDocument
              window.location.href = `/dashboard/projects/${doc.projectId}/documents`
            }}
            emptyTitle={
              activeFilterCount > 0
                ? "No documents match your filters"
                : "No documents found"
            }
            emptyDescription={
              activeFilterCount > 0
                ? "Try adjusting or clearing your filters."
                : "No documents are available to display."
            }
            emptyIcon={
              activeFilterCount > 0 ? (
                <WarningCircleIcon />
              ) : (
                <FileTextIcon />
              )
            }
          />
        )}
      </div>
    </div>
  )
}
