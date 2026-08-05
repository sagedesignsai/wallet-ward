"use client"

import { use, useEffect, useState, useCallback } from "react"
import {
  MagnifyingGlassIcon,
  GitCommitIcon,
  WarningIcon,
  PlusIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useRepository } from "@/hooks/use-repositories"
import { BranchSelector } from "@/components/repositories/branch-selector"
import { CommitList, type Commit } from "@/components/repositories/commit-list"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

interface CommitsResponse {
  data: Commit[]
  next?: string
}

export default function CommitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; repositoryId: string }>
  searchParams: Promise<{ branch?: string }>
}) {
  const { projectId, repositoryId } = use(params)
  return (
    <CommitsInner
      projectId={projectId}
      repositoryId={repositoryId}
      searchParams={searchParams}
    />
  )
}

function CommitsInner({
  projectId,
  repositoryId,
  searchParams,
}: {
  projectId: string
  repositoryId: string
  searchParams: Promise<{ branch?: string }>
}) {
  const sp = use(searchParams)
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const { repository, isLoading: repoLoading } = useRepository(
    projectId,
    repositoryId
  )

  const [branch, setBranch] = useState(sp.branch ?? "")
  const [commits, setCommits] = useState<Commit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  useEffect(() => {
    if (project && repository) {
      setConfig({
        title: "Commits",
        description: `Commit history for ${repository.name}`,
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
          { label: "Commits" },
        ],
      })
    }
  }, [project, repository, setConfig, projectId, repositoryId])

  // Set default branch once repository loads
  useEffect(() => {
    if (repository && !branch) {
      setBranch(repository.branch ?? "main")
    }
  }, [repository, branch])

  const fetchCommits = useCallback(
    async (cursor?: string, append = false) => {
      if (!branch) return

      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const url = new URL(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}/commits`,
          window.location.origin
        )
        url.searchParams.set("branch", branch)
        url.searchParams.set("limit", "30")
        if (cursor) {
          url.searchParams.set("cursor", cursor)
        }

        const res = await fetch(url.toString(), { credentials: "include" })

        if (!res.ok) {
          throw new Error(`Failed to load commits (${res.status})`)
        }

        const body: CommitsResponse = await res.json()

        if (append) {
          setCommits((prev) => [...prev, ...body.data])
        } else {
          setCommits(body.data)
        }

        setNextCursor(body.next ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load commits.")
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [projectId, repositoryId, branch]
  )

  useEffect(() => {
    if (branch) {
      fetchCommits()
    }
  }, [branch, fetchCommits])

  const handleBranchChange = (value: string) => {
    setBranch(value)
    setCommits([])
    setNextCursor(null)
  }

  if (repoLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Branch Selector */}
      <div className="flex items-center gap-3">
        <label className="shrink-0 text-xs text-muted-foreground">Branch</label>
        <BranchSelector
          projectId={projectId}
          repositoryId={repositoryId}
          value={branch}
          onChange={handleBranchChange}
          placeholder="Select branch\u2026"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-lg border border-border/40 bg-card">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="border-b border-border/40 px-3 py-2.5 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && commits.length === 0 && !error && (
        <div className="overflow-hidden rounded-lg border border-dashed border-border/60 bg-card">
          <div className="flex flex-col items-center gap-4 px-6 py-16">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent text-purple-500 ring-1 ring-purple-500/10">
              <GitCommitIcon className="size-7" weight="light" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-foreground">
                No commits found
              </h3>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                {branch
                  ? `No commits found on the "${branch}" branch.`
                  : "Select a branch to view its commit history."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Commits List */}
      {!isLoading && commits.length > 0 && (
        <div className="rounded-lg border border-border/40 bg-card">
          <CommitList commits={commits} repositoryUrl={repository?.url ?? ""} />

          {/* Load More */}
          {nextCursor && (
            <div className="border-t border-border/40 px-3 py-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCommits(nextCursor, true)}
                disabled={isLoadingMore}
                className="w-full"
              >
                {isLoadingMore ? (
                  <>
                    <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading\u2026
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-3.5" />
                    Load more commits
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
