"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import {
  CheckIcon,
  GitBranchIcon,
  GitForkIcon,
  GithubLogoIcon,
  MagnifyingGlassIcon,
  PlugIcon,
  WarningIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useRepositories } from "@/hooks/use-repositories"
import { RepositoryForm } from "@/components/repositories/repository-form"
import type {
  GitHubRepo,
  ProjectIntegration,
  RepositoryFormOutput,
} from "@/components/repositories/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function NewRepositoryPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <NewRepositoryInner projectId={projectId} />
}

function NewRepositoryInner({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { project, isLoading: projectLoading } = useProject(projectId)
  const { createRepository } = useRepositories(projectId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // GitHub import: the project's enabled GitHub integrations gate the picker.
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([])
  const [integrationsLoading, setIntegrationsLoading] = useState(true)
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<
    string | null
  >(null)
  const [importOpen, setImportOpen] = useState(false)
  const [prefill, setPrefill] = useState<
    Partial<RepositoryFormOutput> | undefined
  >(undefined)

  const githubIntegrations = useMemo(
    () =>
      integrations.filter(
        (integration) =>
          integration.provider === "github" && integration.enabled
      ),
    [integrations]
  )

  // Load the project's integrations once. If this fails, the manual form still
  // works and the import path simply stays hidden.
  useEffect(() => {
    let cancelled = false

    async function loadIntegrations() {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/integrations`, {
          credentials: "include",
        })
        if (!res.ok) {
          throw new Error(`Failed to load integrations (${res.status})`)
        }
        const body: { data: ProjectIntegration[] } = await res.json()
        if (!cancelled) {
          setIntegrations(body.data)
        }
      } catch {
        // Non-critical: the import path is an enhancement on top of the form.
      } finally {
        if (!cancelled) {
          setIntegrationsLoading(false)
        }
      }
    }

    loadIntegrations()
    return () => {
      cancelled = true
    }
  }, [projectId])

  // Default the account picker to the first enabled GitHub integration.
  useEffect(() => {
    if (!selectedIntegrationId && githubIntegrations.length > 0) {
      setSelectedIntegrationId(githubIntegrations[0].id)
    }
  }, [githubIntegrations, selectedIntegrationId])

  const handleImportRepo = useCallback((repo: GitHubRepo) => {
    setPrefill({
      name: repo.name,
      url: repo.clone_url,
      description: repo.description ?? undefined,
      provider: "github",
      branch: repo.default_branch,
      accessType: repo.private ? "private" : "public",
    })
  }, [])

  useDashboardConfigStore.setState({
    title: "New Repository",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Projects", href: "/dashboard/projects" },
      {
        label: project?.name ?? "Project",
        href: `/dashboard/projects/${projectId}`,
      },
      {
        label: "Repositories",
        href: `/dashboard/projects/${projectId}/repositories`,
      },
      { label: "New" },
    ],
  })

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WarningIcon className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Project not found</EmptyTitle>
          <EmptyDescription>
            This project may have been deleted.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href="/dashboard/projects">Back to Projects</Link>
        </Button>
      </Empty>
    )
  }

  const handleSubmit = async (data: RepositoryFormOutput) => {
    setIsSubmitting(true)
    try {
      const repo = await createRepository(data)
      if (repo) {
        toast.success("Repository connected successfully")
        router.push(`/dashboard/projects/${projectId}/repositories`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/projects/${projectId}/repositories`)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitBranchIcon className="size-4" />
        <span>Connect a Git repository to sync code and track changes.</span>
      </div>

      {!integrationsLoading &&
        (githubIntegrations.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <GithubLogoIcon className="size-4 shrink-0" />
              <span>
                Pick a repository from your connected GitHub account and
                pre-fill the form below.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {githubIntegrations.length > 1 && (
                <Select
                  value={selectedIntegrationId ?? undefined}
                  onValueChange={setSelectedIntegrationId}
                >
                  <SelectTrigger className="w-44" aria-label="GitHub account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {githubIntegrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.id}>
                        {integration.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={() => setImportOpen(true)}
                disabled={!selectedIntegrationId}
              >
                <GithubLogoIcon className="size-3.5" weight="fill" />
                Import from GitHub
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(`/dashboard/projects/${projectId}/integrations`)
                }
              >
                <PlugIcon className="size-3.5" />
                Manage integrations
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <GithubLogoIcon className="size-4 shrink-0" />
              <span>Connect a GitHub account to import repositories.</span>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/projects/${projectId}/integrations`)
              }
            >
              <GithubLogoIcon className="size-3.5" weight="fill" />
              Connect GitHub account
            </Button>
          </div>
        ))}

      <RepositoryForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        initialValues={prefill}
        isEditing={false}
      />

      <GitHubImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        projectId={projectId}
        integrationId={selectedIntegrationId}
        onSelect={handleImportRepo}
      />
    </div>
  )
}

function GitHubImportDialog({
  open,
  onOpenChange,
  projectId,
  integrationId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  integrationId: string | null
  onSelect: (repo: GitHubRepo) => void
}) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const fetchRepos = useCallback(async () => {
    if (!integrationId) return

    setIsLoading(true)
    setError(null)
    setRepos([])
    setSelectedId(null)

    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/integrations/${integrationId}/github?type=repos`,
        { credentials: "include" }
      )

      if (!res.ok) {
        const body: { error?: { message?: string } | string } | null = await res
          .json()
          .catch(() => null)
        const apiError = body?.error
        const message =
          (typeof apiError === "string" ? apiError : apiError?.message) ||
          `Failed to load repositories (${res.status})`
        throw new Error(message)
      }

      const body: { data: GitHubRepo[] } = await res.json()
      setRepos(Array.isArray(body.data) ? body.data : [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load repositories"
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId, integrationId])

  useEffect(() => {
    if (!open) return
    setSearch("")
    fetchRepos()
  }, [open, fetchRepos])

  const filteredRepos = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return repos
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description ?? "").toLowerCase().includes(query)
    )
  }, [repos, search])

  const selectedRepo = repos.find((repo) => repo.id === selectedId) ?? null

  const handleSelect = () => {
    if (!selectedRepo) return
    onSelect(selectedRepo)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Choose a repository to pre-fill the connection form below.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="h-7 pl-7 text-xs"
            disabled={isLoading || !!error}
          />
        </div>

        <div className="min-h-[240px]">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-6 text-center">
              <p className="text-xs text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchRepos}>
                Try again
              </Button>
            </div>
          ) : filteredRepos.length === 0 ? (
            <Empty className="rounded-lg border border-border/40 bg-card py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GitForkIcon className="size-4" />
                </EmptyMedia>
                <EmptyTitle>
                  {repos.length === 0 ? "No repositories found" : "No matches"}
                </EmptyTitle>
                <EmptyDescription>
                  {repos.length === 0
                    ? "No repositories found for this account."
                    : "No repositories match your search."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ScrollArea className="h-72 rounded-md border border-border/40">
              <ul className="divide-y divide-border/60">
                {filteredRepos.map((repo) => {
                  const selected = repo.id === selectedId
                  return (
                    <li key={repo.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(repo.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors",
                          selected ? "bg-primary/5" : "hover:bg-muted"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <GitForkIcon
                            className={cn(
                              "size-3.5 shrink-0",
                              selected
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">
                              {repo.name}
                            </p>
                            <p className="truncate font-mono text-[0.625rem] text-muted-foreground">
                              {repo.full_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge
                            variant={repo.private ? "secondary" : "outline"}
                          >
                            {repo.private ? "Private" : "Public"}
                          </Badge>
                          {repo.fork && <Badge variant="outline">Fork</Badge>}
                          <span className="font-mono text-[0.625rem] text-muted-foreground">
                            {repo.default_branch}
                          </span>
                          {selected && (
                            <CheckIcon className="size-3.5 text-primary" />
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={selectedId === null}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
