"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  StackSimpleIcon,
  RocketIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjects, type Project } from "@/hooks/use-projects"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectRowActions } from "@/components/projects/project-row-actions"

function envBadgeVariant(slug: string): "default" | "secondary" | "outline" {
  if (slug === "production") return "default"
  if (slug === "staging") return "outline"
  return "secondary"
}

export default function ProjectsPage() {
  const { setConfig } = useDashboardConfig()
  const router = useRouter()
  const {
    projects,
    isLoading,
    error,
    refetch,
    createProject,
    deleteProject,
  } = useProjects()

  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    setConfig({
      description: "Manage your vault projects and their environments",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects" },
      ],
      actions: (
        <Button size="default" onClick={() => setCreateOpen(true)} className="shadow-md shadow-primary/10 transition-shadow hover:shadow-lg hover:shadow-primary/20">
          <PlusIcon />
          New Project
        </Button>
      ),
    })
  }, [setConfig])

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [projects, search])

  const totalEnvironments = useMemo(
    () => projects.reduce((sum, p) => sum + p.environments.length, 0),
    [projects]
  )

  const productionEnvironments = useMemo(
    () =>
      projects.reduce(
        (sum, p) =>
          sum + p.environments.filter((e) => e.slug === "production").length,
        0
      ),
    [projects]
  )

  const handleRowClick = useCallback(
    (project: Project) => {
      router.push(`/dashboard/projects/${project.id}`)
    },
    [router]
  )

  const handleCreated = useCallback(() => {
    refetch()
  }, [refetch])

  const columns: DataTableColumn<Project>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Project",
        className: "w-[280px]",
        render: (project) => (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-medium text-foreground truncate">
              {project.name}
            </span>
            <span className="font-mono text-[0.625rem] text-muted-foreground truncate">
              {project.slug}
            </span>
          </div>
        ),
      },
      {
        key: "description",
        header: "Description",
        className: "w-[220px]",
        render: (project) =>
          project.description ? (
            <span className="text-muted-foreground line-clamp-2">
              {project.description}
            </span>
          ) : (
            <span className="italic text-muted-foreground/60">No description</span>
          ),
      },
      {
        key: "environments",
        header: "Environments",
        className: "w-[260px]",
        render: (project) => {
          const envs = project.environments
          if (envs.length === 0) {
            return (
              <span className="text-muted-foreground/60 italic text-[0.625rem]">
                None
              </span>
            )
          }
          return (
            <div className="flex flex-wrap gap-1">
              {envs.map((env) => (
                <Badge
                  key={env.id}
                  variant={envBadgeVariant(env.slug)}
                  className="transition-colors"
                >
                  {env.name}
                </Badge>
              ))}
            </div>
          )
        },
      },
      {
        key: "createdAt",
        header: "Created",
        className: "w-[100px]",
        render: (project) => <TimeAgo date={project.createdAt} />,
      },
      {
        key: "actions",
        header: "",
        className: "w-[40px] text-right",
        render: (project) => (
          <ProjectRowActions project={project} onDelete={deleteProject} />
        ),
      },
    ],
    [deleteProject]
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button
            onClick={refetch}
            className="ml-2 font-medium underline underline-offset-2 hover:text-destructive/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Projects"
          value={isLoading ? "—" : projects.length}
          icon={
            <div className="relative">
              <FolderIcon className="size-4" />
            </div>
          }
          description={projects.length === 1 ? "1 project" : `${projects.length} projects`}
        />
        <StatCard
          label="Total Environments"
          value={isLoading ? "—" : totalEnvironments}
          icon={
            <div className="relative">
              <StackSimpleIcon className="size-4" />
            </div>
          }
          description={`Across all projects`}
        />
        <StatCard
          label="Production"
          value={isLoading ? "—" : productionEnvironments}
          icon={
            <div className="relative">
              <RocketIcon className="size-4" />
            </div>
          }
          description={`Active production environment${productionEnvironments !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Toolbar + Table */}
      <div className="flex flex-col gap-2.5">
        <DataTableToolbar
          searchPlaceholder="Search projects..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        {!isLoading && filtered.length === 0 && projects.length === 0 ? (
          /* Rich empty state — no projects exist at all */
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
            <div className="flex flex-col items-center gap-4 py-12 px-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary ring-1 ring-primary/10 transition-transform hover:scale-105">
                <FolderOpenIcon className="size-7" weight="light" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-foreground">
                  No projects yet
                </h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Create your first project to start organizing secrets across
                  environments.
                </p>
              </div>
              <Button
                size="default"
                onClick={() => setCreateOpen(true)}
                className="shadow-md shadow-primary/10 transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                <PlusIcon />
                Create Project
              </Button>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered as (Project & Record<string, unknown>)[]}
            isLoading={isLoading}
            loadingRows={5}
            onRowClick={handleRowClick}
            keyExtractor={(p) => p.id}
            emptyTitle={search ? "No matching projects" : "No projects yet"}
            emptyDescription={
              search
                ? `No projects found for "${search}". Try a different search term.`
                : "Create your first project to start organizing secrets across environments."
            }
            emptyIcon={<FolderOpenIcon />}
          />
        )}
      </div>

      {/* Create Dialog */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
        createProject={createProject}
      />
    </div>
  )
}
