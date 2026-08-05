"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import {
  GithubLogoIcon,
  GitlabLogoIcon,
  CodeIcon,
  WarningIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
  TrashIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
  ArrowSquareOutIcon,
  ArrowClockwiseIcon,
  GitBranchIcon,
  GitCommitIcon,
  GearIcon,
  LinkIcon,
} from "@phosphor-icons/react"
import type { RepositoryProvider } from "@prisma/client"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useRepositories, useRepository } from "@/hooks/use-repositories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function getProviderIcon(provider: RepositoryProvider) {
  switch (provider) {
    case "github":
      return GithubLogoIcon
    case "gitlab":
      return GitlabLogoIcon
    case "bitbucket":
    case "custom":
    default:
      return CodeIcon
  }
}

function getProviderColor(provider: RepositoryProvider): string {
  switch (provider) {
    case "github":
      return "text-gray-900 dark:text-gray-100"
    case "gitlab":
      return "text-orange-500"
    case "bitbucket":
      return "text-blue-500"
    default:
      return "text-muted-foreground"
  }
}

function getSyncStatusBadge(status: string) {
  switch (status) {
    case "synced":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
        >
          <CheckCircleIcon className="size-3" weight="fill" />
          Synced
        </Badge>
      )
    case "syncing":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600"
        >
          <ClockIcon className="size-3" weight="fill" />
          Syncing
        </Badge>
      )
    case "error":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-destructive/30 bg-destructive/10 text-destructive"
        >
          <WarningCircleIcon className="size-3" weight="fill" />
          Error
        </Badge>
      )
    case "never_synced":
      return (
        <Badge variant="outline" className="gap-1">
          <ClockIcon className="size-3" />
          Not synced
        </Badge>
      )
    default:
      return null
  }
}

function getProviderLabel(provider: RepositoryProvider): string {
  switch (provider) {
    case "github":
      return "GitHub"
    case "gitlab":
      return "GitLab"
    case "bitbucket":
      return "Bitbucket"
    default:
      return "Custom"
  }
}

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; repositoryId: string }>
}) {
  const { projectId, repositoryId } = use(params)
  return (
    <RepositoryDetailInner projectId={projectId} repositoryId={repositoryId} />
  )
}

function RepositoryDetailInner({
  projectId,
  repositoryId,
}: {
  projectId: string
  repositoryId: string
}) {
  const router = useRouter()
  const { project } = useProject(projectId)
  const { repository, isLoading, error } = useRepository(
    projectId,
    repositoryId
  )
  const { updateRepository, deleteRepository } = useRepositories(projectId)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [branch, setBranch] = useState("")
  const [accessType, setAccessType] = useState<"public" | "private">("private")
  const [dirty, setDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (repository) {
      setName(repository.name)
      setDescription(repository.description ?? "")
      setBranch(repository.branch ?? "main")
      setAccessType(repository.accessType)
      setDirty(false)
    }
  }, [repository])

  if (project && repository) {
    useDashboardConfigStore.setState({
      title: repository.name,
      actions: null,
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project.name, href: `/dashboard/projects/${projectId}` },
        {
          label: "Repositories",
          href: `/dashboard/projects/${projectId}/repositories`,
        },
        { label: repository.name },
      ],
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    const updated = await updateRepository(repositoryId, {
      name: name.trim(),
      description: description.trim() || undefined,
      branch: branch.trim() || undefined,
      accessType,
    })
    setIsSaving(false)
    if (updated) {
      setDirty(false)
      toast.success("Repository updated")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this repository? This cannot be undone.")) return
    const ok = await deleteRepository(repositoryId)
    if (ok) {
      toast.success("Repository deleted")
      router.push(`/dashboard/projects/${projectId}/repositories`)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/repositories/${repositoryId}/sync`,
        { method: "POST", credentials: "include" }
      )
      if (!res.ok) throw new Error("Sync failed")
      toast.success("Repository synced")
      window.location.reload()
    } catch {
      toast.error("Failed to sync repository")
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
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
              <CodeIcon className="size-4" />
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

  const ProviderIcon = getProviderIcon(repository.provider)
  const providerColor = getProviderColor(repository.provider)

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {/* Header section */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60",
            providerColor
          )}
        >
          <ProviderIcon className="size-5" weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">
              {repository.name}
            </h1>
            {getSyncStatusBadge(repository.syncStatus)}
            <Badge variant="secondary" className="gap-1">
              {getProviderLabel(repository.provider)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/dashboard/projects/${projectId}/repositories/${repositoryId}/branches`}
          >
            <GitBranchIcon className="mr-1.5 size-3.5" />
            Branches
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/dashboard/projects/${projectId}/repositories/${repositoryId}/commits`}
          >
            <GitCommitIcon className="mr-1.5 size-3.5" />
            Commits
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/dashboard/projects/${projectId}/repositories/${repositoryId}/settings`}
          >
            <GearIcon className="mr-1.5 size-3.5" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Repository URL */}
      <div className="space-y-1.5">
        <Label>Repository URL</Label>
        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-sm break-all text-primary hover:underline"
        >
          {repository.url}
          <ArrowSquareOutIcon className="size-3.5 shrink-0" />
        </a>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="repo-name">Name</Label>
        <Input
          id="repo-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="repo-description">Description</Label>
        <Textarea
          id="repo-description"
          className="min-h-[100px]"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      {/* Branch */}
      <div className="space-y-1.5">
        <Label htmlFor="repo-branch">Default Branch</Label>
        <Input
          id="repo-branch"
          value={branch}
          className="font-mono"
          onChange={(e) => {
            setBranch(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      {/* Access Type */}
      <div className="space-y-1.5">
        <Label>Visibility</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={accessType === "private" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => {
              setAccessType("private")
              setDirty(true)
            }}
          >
            <LockKeyIcon className="size-3.5" />
            Private
          </Button>
          <Button
            type="button"
            variant={accessType === "public" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => {
              setAccessType("public")
              setDirty(true)
            }}
          >
            <LockKeyOpenIcon className="size-3.5" />
            Public
          </Button>
        </div>
        <p className="text-[0.625rem] text-muted-foreground">
          {accessType === "private"
            ? "Only project members can access this repository"
            : "Anyone with the link can view this repository"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={!dirty || isSaving}>
          {isSaving ? "Saving\u2026" : "Save"}
        </Button>
        <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
          <ArrowClockwiseIcon
            className={cn("mr-1.5 size-3.5", isSyncing && "animate-spin")}
          />
          {isSyncing ? "Syncing\u2026" : "Sync"}
        </Button>
        <Button
          variant="ghost"
          className="ml-auto gap-1.5 text-red-400 hover:text-red-300"
          onClick={handleDelete}
        >
          <TrashIcon className="size-3.5" />
          Delete
        </Button>
      </div>

      {/* Metadata footer */}
      <div className="flex items-center gap-4 border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <span>
          Created {new Date(repository.createdAt).toLocaleDateString()}
        </span>
        {repository.lastSyncAt && (
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3" />
            Last synced {new Date(repository.lastSyncAt).toLocaleDateString()}
          </span>
        )}
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
