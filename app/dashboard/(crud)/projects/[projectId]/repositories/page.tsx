"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  PlusIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useRepositories } from "@/hooks/use-repositories"
import { RepositoryCard } from "@/components/repositories/repository-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Repository } from "@prisma/client"

export default function ProjectRepositoriesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <ProjectRepositoriesInner projectId={projectId} />
}

function ProjectRepositoriesInner({ projectId }: { projectId: string }) {
  const { repositories, isLoading, error, deleteRepository } =
    useRepositories(projectId)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Repository | null>(null)

  useDashboardConfigStore.setState({
    title: "Repositories",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Projects", href: "/dashboard/projects" },
      { label: "Repositories" },
    ],
  })

  const filteredRepositories = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description &&
        repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDelete = async (repository: Repository) => {
    setDeleteTarget(repository)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteRepository(deleteTarget.id)
    setDeleteTarget(null)
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
        <div className="max-w-md flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/projects/${projectId}/repositories/new`}>
            <PlusIcon className="size-4" />
            Add Repository
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
      {!isLoading && repositories.length === 0 && !error && (
        <Empty className="rounded-lg border border-dashed border-border/60 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No repositories yet</EmptyTitle>
            <EmptyDescription>
              Connect your Git repositories to give agents access to your
              codebase.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild className="mt-2">
            <Link href={`/dashboard/projects/${projectId}/repositories/new`}>
              <PlusIcon />
              Add Repository
            </Link>
          </Button>
        </Empty>
      )}

      {/* Repositories Grid */}
      {!isLoading && filteredRepositories.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRepositories.map((repository) => (
            <RepositoryCard
              key={repository.id}
              repository={repository}
              projectId={projectId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading &&
        repositories.length > 0 &&
        filteredRepositories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No repositories match your search.
            </p>
          </div>
        )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete repository?"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete Repository"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
