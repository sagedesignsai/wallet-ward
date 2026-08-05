"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import {
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjectStore } from "@/stores/project-store"
import {
  useGlobalDocuments,
  type GlobalDocument,
} from "@/hooks/use-global-documents"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

export default function GlobalDocumentsPage() {
  const { setConfig } = useDashboardConfig()
  const router = useRouter()
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const {
    documents: allDocuments,
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

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  )

  // Filter documents to only show current project
  const documents = useMemo(() => {
    if (!activeProjectId) return allDocuments
    return allDocuments.filter((d) => d.projectId === activeProjectId)
  }, [allDocuments, activeProjectId])

  useEffect(() => {
    setConfig({
      title: "Documents",
      description: activeProject
        ? `Documents in ${activeProject.name}`
        : "Project documents",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Documents" },
      ],
    })
  }, [setConfig, activeProject])

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
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
                  <FileTextIcon className="size-3" />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/projects/${doc.projectId}/documents/${doc.id}`}
                    className="block truncate font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {doc.title}
                  </Link>
                  {doc.content && (
                    <span className="block truncate text-[0.625rem] text-muted-foreground">
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
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
            className="ml-2 font-medium underline underline-offset-2 transition-colors hover:text-destructive/80"
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
            distinctProjects === 1
              ? "1 project"
              : `${distinctProjects} projects`
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
            className="h-8 max-w-xs text-xs"
          />
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {!isLoading && documents.length === 0 && !error ? (
          <Empty className="rounded-lg border border-border/60 bg-card py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpenIcon className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No documents yet</EmptyTitle>
              <EmptyDescription>
                Create your first document within a project to get started.
              </EmptyDescription>
            </EmptyHeader>
            <Button asChild className="mt-2">
              <Link href="/dashboard/projects">
                <FolderIcon />
                Go to Projects
              </Link>
            </Button>
          </Empty>
        ) : (
          <DataTable
            columns={columns as DataTableColumn<Record<string, unknown>>[]}
            data={filtered as (GlobalDocument & Record<string, unknown>)[]}
            isLoading={isLoading}
            loadingRows={5}
            keyExtractor={(d) => String((d as unknown as GlobalDocument).id)}
            onRowClick={(row) => {
              const doc = row as unknown as GlobalDocument
              router.push(`/dashboard/projects/${doc.projectId}/documents`)
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
              activeFilterCount > 0 ? <WarningCircleIcon /> : <FileTextIcon />
            }
          />
        )}
      </div>
    </div>
  )
}
