"use client"

import React, { useState, useMemo, useCallback, use } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  StackSimpleIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import type { ProjectEnvironment } from "@/hooks/use-projects"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/data-table"
import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar"
import { CreateEnvironmentDialog } from "@/components/projects/create-environment-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function envBadgeVariant(slug: string): "default" | "secondary" | "outline" {
  if (slug === "production") return "default"
  if (slug === "staging") return "outline"
  return "secondary"
}

export default function EnvironmentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)

  return <EnvironmentsInner projectId={projectId} />
}

function EnvironmentsInner({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { project, isLoading, error, refetch } = useProject(projectId)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  if (project) {
    useDashboardConfigStore.setState({
      actions: (
        <Button
          size="default"
          onClick={() => setCreateOpen(true)}
          className="shadow-md shadow-primary/10 transition-shadow hover:shadow-lg hover:shadow-primary/20"
        >
          <PlusIcon />
          New Environment
        </Button>
      ),
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        {
          label: project.name,
          href: `/dashboard/projects/${projectId}`,
        },
        { label: "Environments" },
      ],
    })
  }

  const environments = project?.environments ?? []

  const filtered = useMemo(() => {
    if (!search.trim()) return environments
    const q = search.toLowerCase()
    return environments.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
    )
  }, [environments, search])

  const handleCreated = useCallback(() => {
    refetch()
  }, [refetch])

  const handleRowClick = useCallback(
    (env: ProjectEnvironment) => {
      router.push(`/dashboard/projects/${projectId}/environments/${env.id}`)
    },
    [projectId, router]
  )

  const columns: DataTableColumn<ProjectEnvironment>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Environment",
        className: "w-[240px]",
        render: (env) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground">
                {env.name}
              </span>
              <Badge variant={envBadgeVariant(env.slug)} className="shrink-0">
                {env.slug}
              </Badge>
            </div>
            <span className="truncate font-mono text-[0.625rem] text-muted-foreground">
              {env.slug}
            </span>
          </div>
        ),
      },
      {
        key: "description",
        header: "Description",
        className: "w-[220px]",
        render: (env) =>
          env.description ? (
            <span className="line-clamp-2 text-muted-foreground">
              {env.description}
            </span>
          ) : (
            <span className="text-muted-foreground/60 italic">
              No description
            </span>
          ),
      },
      {
        key: "createdAt",
        header: "Created",
        className: "w-[100px]",
        render: (env) => <TimeAgo date={env.createdAt} />,
      },
      {
        key: "actions",
        header: "",
        className: "w-[40px] text-right",
        render: (env) => (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              handleRowClick(env)
            }}
          >
            <ArrowRightIcon />
            <span className="sr-only">View</span>
          </Button>
        ),
      },
    ],
    [handleRowClick]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-7 w-64 rounded" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Failed to load environments
          </h3>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {error ?? "Project not found."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex animate-in flex-col gap-4 duration-300 fade-in">
      <div className="flex flex-col gap-2.5">
        <DataTableToolbar
          searchPlaceholder="Search environments..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        <DataTable
          columns={columns}
          data={filtered as (ProjectEnvironment & Record<string, unknown>)[]}
          isLoading={false}
          onRowClick={handleRowClick}
          keyExtractor={(env) => env.id}
          emptyTitle={
            search ? "No matching environments" : "No environments yet"
          }
          emptyDescription={
            search
              ? `No environments found for "${search}". Try a different search term.`
              : "Create your first environment to start organizing secrets."
          }
          emptyIcon={<StackSimpleIcon />}
        />
      </div>

      <CreateEnvironmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
        projectId={projectId}
      />
    </div>
  )
}
