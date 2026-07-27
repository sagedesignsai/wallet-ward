"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  WarningIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  ArrowSquareOutIcon,
  GearIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useRepositories, useRepository } from "@/hooks/use-repositories"
import { RepositoryForm } from "@/components/repositories/repository-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { toast } from "sonner"
import type { RepositoryFormOutput } from "@/components/repositories/types"

export default function RepositorySettingsPage({
  params,
}: {
  params: Promise<{ projectId: string; repositoryId: string }>
}) {
  const { projectId, repositoryId } = use(params)
  return (
    <RepositorySettingsInner
      projectId={projectId}
      repositoryId={repositoryId}
    />
  )
}

function RepositorySettingsInner({
  projectId,
  repositoryId,
}: {
  projectId: string
  repositoryId: string
}) {
  const router = useRouter()
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const { repository, isLoading, error } = useRepository(
    projectId,
    repositoryId
  )
  const { updateRepository, deleteRepository } = useRepositories(projectId)

  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (project && repository) {
      setConfig({
        title: "Settings",
        description: `Configure ${repository.name}`,
        actions: null,
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          {
            label: project.name,
            href: `/dashboard/projects/${projectId}`,
          },
          {
            label: "Repositories",
            href: `/dashboard/projects/${projectId}/repositories`,
          },
          {
            label: repository.name,
            href: `/dashboard/projects/${projectId}/repositories/${repositoryId}`,
          },
          { label: "Settings" },
        ],
      })
    }
  }, [project, repository, setConfig, projectId, repositoryId])

  const handleUpdate = async (data: RepositoryFormOutput) => {
    setIsSaving(true)
    const updated = await updateRepository(repositoryId, {
      name: data.name,
      description: data.description,
      branch: data.branch,
      accessType: data.accessType,
    })
    setIsSaving(false)
    if (updated) {
      toast.success("Repository settings updated")
    }
  }

  const handleDelete = async () => {
    const ok = await deleteRepository(repositoryId)
    if (ok) {
      toast.success("Repository deleted")
      router.push(`/dashboard/projects/${projectId}/repositories`)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[100px] rounded-lg" />
      </div>
    )
  }

  if (error || !repository) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {error ? (
              <WarningIcon className="size-4" />
            ) : (
              <GearIcon className="size-4" />
            )}
          </EmptyMedia>
          <EmptyTitle>Repository not found</EmptyTitle>
          <EmptyDescription>
            {error ?? "This repository may have been deleted."}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href={`/dashboard/projects/${projectId}/repositories`}>
            Back to Repositories
          </Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Repository Form */}
      <div className="rounded-lg border border-border/40 bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold">Repository Details</h2>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            Edit
          </Badge>
        </div>
        <RepositoryForm
          onSubmit={handleUpdate}
          onCancel={() =>
            router.push(
              `/dashboard/projects/${projectId}/repositories/${repositoryId}`
            )
          }
          isSubmitting={isSaving}
          initialValues={{
            name: repository.name,
            url: repository.url,
            description: repository.description ?? "",
            provider: repository.provider,
            branch: repository.branch ?? "main",
            accessType: repository.accessType,
          }}
        />
      </div>

      {/* Sync Status */}
      <div className="rounded-lg border border-border/40 bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">Sync Status</h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {repository.syncStatus === "synced" && (
              <CheckCircleIcon
                className="size-3.5 text-emerald-500"
                weight="fill"
              />
            )}
            {repository.syncStatus === "syncing" && (
              <ClockIcon className="size-3.5 text-blue-500" weight="fill" />
            )}
            {repository.syncStatus === "error" && (
              <WarningCircleIcon
                className="size-3.5 text-destructive"
                weight="fill"
              />
            )}
            {repository.syncStatus === "never_synced" && (
              <ClockIcon className="size-3.5" />
            )}
            <span className="capitalize">
              {repository.syncStatus.replace("_", " ")}
            </span>
          </div>
          {repository.lastSyncAt && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              Last synced{" "}
              {new Date(repository.lastSyncAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            View on provider
            <ArrowSquareOutIcon className="size-3" />
          </a>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-destructive">
            Danger Zone
          </h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Permanently delete this repository and all associated data. This
          action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <TrashIcon className="size-3.5" />
            Delete Repository
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <TrashIcon className="size-3.5" />
              Confirm Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <span>
          Created{" "}
          {new Date(repository.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        {repository._count && repository._count.webhooks > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {repository._count.webhooks} webhook
            {repository._count.webhooks > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  )
}
