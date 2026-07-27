"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  GitBranchIcon,
  MagnifyingGlassIcon,
  GitCommitIcon,
  WarningIcon,
  TreeStructureIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useRepository } from "@/hooks/use-repositories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { TimeAgo } from "@/components/dashboard/time-ago"

interface Branch {
  name: string
  isDefault: boolean
  lastCommit?: {
    message: string
    date: string
  }
}

export default function BranchesPage({
  params,
}: {
  params: Promise<{ projectId: string; repositoryId: string }>
}) {
  const { projectId, repositoryId } = use(params)
  return <BranchesInner projectId={projectId} repositoryId={repositoryId} />
}

function BranchesInner({
  projectId,
  repositoryId,
}: {
  projectId: string
  repositoryId: string
}) {
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const { repository, isLoading: repoLoading } = useRepository(
    projectId,
    repositoryId
  )

  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (project && repository) {
      setConfig({
        title: "Branches",
        description: `Manage branches for ${repository.name}`,
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
          { label: "Branches" },
        ],
      })
    }
  }, [project, repository, setConfig, projectId, repositoryId])

  useEffect(() => {
    let cancelled = false

    async function fetchBranches() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/repositories/${repositoryId}/branches`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to load branches (${res.status})`)
        }

        const body: { data: Branch[] } = await res.json()
        if (!cancelled) {
          setBranches(body.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load branches."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBranches()
    return () => {
      cancelled = true
    }
  }, [projectId, repositoryId])

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="max-w-md flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search branches\u2026"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col gap-0 rounded-lg border border-border/40 bg-card">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="border-b border-border/40 px-3 py-2.5 last:border-b-0"
            >
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-1.5 h-3 w-72" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && branches.length === 0 && !error && (
        <div className="overflow-hidden rounded-lg border border-dashed border-border/60 bg-card">
          <div className="flex flex-col items-center gap-4 px-6 py-16">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent text-purple-500 ring-1 ring-purple-500/10">
              <TreeStructureIcon className="size-7" weight="light" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-foreground">
                No branches found
              </h3>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                This repository may not have been synced yet. Try syncing to
                fetch branches.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Branches Table */}
      {!isLoading && filteredBranches.length > 0 && (
        <div className="rounded-lg border border-border/40 bg-card">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_2fr_auto] gap-3 border-b border-border/40 px-3 py-2 text-[0.625rem] font-medium tracking-wider text-muted-foreground uppercase">
            <span>Branch</span>
            <span>Last Commit</span>
            <span>Updated</span>
          </div>

          {/* Branch Rows */}
          {filteredBranches.map((branch) => (
            <Link
              key={branch.name}
              href={`/dashboard/projects/${projectId}/repositories/${repositoryId}/commits?branch=${encodeURIComponent(branch.name)}`}
              className="grid grid-cols-[1fr_2fr_auto] gap-3 border-b border-border/40 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-center gap-2">
                <GitBranchIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-xs">
                  {branch.name}
                </span>
                {branch.isDefault && (
                  <Badge
                    variant="secondary"
                    className="h-4 shrink-0 px-1.5 text-[10px]"
                  >
                    default
                  </Badge>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                {branch.lastCommit ? (
                  <>
                    <GitCommitIcon className="size-3 shrink-0" />
                    <span className="truncate">
                      {branch.lastCommit.message}
                    </span>
                  </>
                ) : (
                  <span>No commits</span>
                )}
              </div>
              <div className="flex shrink-0 items-center">
                {branch.lastCommit?.date && (
                  <TimeAgo date={branch.lastCommit.date} />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && branches.length > 0 && filteredBranches.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No branches match your search.
          </p>
        </div>
      )}
    </div>
  )
}
