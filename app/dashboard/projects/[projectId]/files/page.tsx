"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  PlusIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjectFiles } from "@/hooks/use-project-files"
import { FileCard } from "@/components/files/file-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProjectFile, FileType } from "@prisma/client"

export default function ProjectFilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <ProjectFilesInner projectId={projectId} />
}

function ProjectFilesInner({ projectId }: { projectId: string }) {
  const { setConfig } = useDashboardConfig()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<FileType | "all">("all")
  const [deleteTarget, setDeleteTarget] = useState<ProjectFile | null>(null)
  
  const { files, isLoading, error, deleteFile } = useProjectFiles(
    projectId,
    typeFilter !== "all" ? { type: typeFilter } : undefined
  )

  useEffect(() => {
    setConfig({
      title: "Files",
      description: "Manage files and artifacts for this project",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: "Files" },
      ],
    })
  }, [setConfig])

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (file.tags && file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const handleDelete = async (file: ProjectFile) => {
    setDeleteTarget(file)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteFile(deleteTarget.id)
    setDeleteTarget(null)
  }

  const handleDownload = async (file: ProjectFile) => {
    if (file.url) {
      window.open(file.url, "_blank")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as FileType | "all")}
          >
            <SelectTrigger className="w-[140px] h-9">
              <FunnelIcon className="size-4 mr-2" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="artifact">Artifacts</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="config">Configs</SelectItem>
              <SelectItem value="asset">Assets</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href={`/dashboard/projects/${projectId}/files/upload`}>
            <PlusIcon className="size-4" />
            Upload File
          </Link>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && files.length === 0 && !error && (
        <Empty className="rounded-lg border border-dashed border-border/60 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No files yet</EmptyTitle>
            <EmptyDescription>
              Upload files, artifacts, and documents to organize your project resources.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild className="mt-2">
            <Link href={`/dashboard/projects/${projectId}/files/upload`}>
              <PlusIcon />
              Upload File
            </Link>
          </Button>
        </Empty>
      )}

      {/* Files Grid */}
      {!isLoading && filteredFiles.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              projectId={projectId}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && files.length > 0 && filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No files match your search or filter.
          </p>
        </div>
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete file?"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete File"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
