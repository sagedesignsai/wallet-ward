"use client"

import React, { useEffect, use } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  ClockCounterClockwiseIcon,
  FolderOpenIcon,
  StackSimpleIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function envBadgeVariant(slug: string): "default" | "secondary" | "outline" {
  if (slug === "production") return "default"
  if (slug === "staging") return "outline"
  return "secondary"
}

function envGradient(slug: string): string {
  if (slug === "production")
    return "from-primary/8 via-primary/3 to-transparent border-l-primary/40"
  if (slug === "staging")
    return "from-amber-500/8 via-amber-500/3 to-transparent border-l-amber-500/40"
  return "from-muted/40 via-muted/20 to-transparent border-l-muted-foreground/20"
}

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)

  return <ProjectOverviewInner projectId={projectId} />
}

function ProjectOverviewInner({ projectId }: { projectId: string }) {
  const { setConfig } = useDashboardConfig()
  const { project, isLoading, error } = useProject(projectId)

  useEffect(() => {
    if (project) {
      setConfig({
        title: project.name,
        description: project.description ?? "No description",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          { label: project.name },
        ],
      })
    }
  }, [project, setConfig])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-[140px] rounded-lg" />
          <Skeleton className="h-[140px] rounded-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[120px] rounded-lg" />
          <Skeleton className="h-[120px] rounded-lg" />
          <Skeleton className="h-[120px] rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <FolderOpenIcon className="size-7" weight="light" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Project not found
          </h3>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
            {error ??
              "This project may have been deleted or you may not have access."}
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="text-xs text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    )
  }

  const environments = project.environments ?? []

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Top info row */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Project Info Card */}
        <Card className="gap-0">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <StackSimpleIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm">{project.name}</CardTitle>
                  <span className="font-mono text-[0.625rem] text-muted-foreground">
                    {project.slug}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {project.description ?? "No description provided."}
            </p>
            <div className="mt-3 flex items-center gap-4 text-[0.625rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ClockCounterClockwiseIcon className="size-3" />
                Created <TimeAgo date={project.createdAt} />
              </span>
              <span className="flex items-center gap-1">
                Updated <TimeAgo date={project.updatedAt} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-1">
          <StatCard
            label="Environments"
            value={environments.length}
            icon={
              <div className="relative">
                <StackSimpleIcon className="size-4" />
              </div>
            }
            description={
              environments.length === 1
                ? "1 environment configured"
                : `${environments.length} environments configured`
            }
          />
        </div>
      </div>

      {/* Environments Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-foreground">Environments</h2>
          <Link
            href={`/dashboard/projects/${projectId}/environments`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {environments.length === 0 ? (
          <div className="overflow-hidden rounded-lg border border-dashed border-border/60 bg-card">
            <div className="flex flex-col items-center gap-3 py-10 px-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary ring-1 ring-primary/10">
                <StackSimpleIcon className="size-6" weight="light" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-foreground">
                  No environments yet
                </h3>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Create your first environment to start organizing secrets.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {environments.map((env) => (
              <Link
                key={env.id}
                href={`/dashboard/projects/${projectId}/environments/${env.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-lg border border-l-[3px] bg-gradient-to-r p-4 ring-1 ring-foreground/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5",
                  envGradient(env.slug)
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {env.name}
                      </span>
                      <Badge
                        variant={envBadgeVariant(env.slug)}
                        className="shrink-0"
                      >
                        {env.slug}
                      </Badge>
                    </div>
                    {env.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {env.description}
                      </p>
                    )}
                    <p className="mt-2 text-[0.625rem] text-muted-foreground">
                      Created <TimeAgo date={env.createdAt} />
                    </p>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
