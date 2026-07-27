"use client"

import { useEffect, useMemo } from "react"
import {
  ListChecksIcon,
  FolderIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjectStore } from "@/stores/project-store"
import { useGlobalTasks } from "@/hooks/use-global-tasks"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  TaskFilters,
  TaskKanban,
  TaskEmptyState,
} from "@/components/dashboard/global-tasks"

export default function GlobalTasksPage() {
  const { setConfig } = useDashboardConfig()
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const {
    tasks: allTasks,
    filtered,
    isLoading,
    error,
    filters,
    activeFilterCount,
    projects,
    setFilter,
    clearFilters,
    refetch,
  } = useGlobalTasks()

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  )

  // Filter tasks to only show current project
  const tasks = useMemo(() => {
    if (!activeProjectId) return allTasks
    return allTasks.filter((t) => t.projectId === activeProjectId)
  }, [allTasks, activeProjectId])

  useEffect(() => {
    setConfig({
      title: "Tasks",
      description: activeProject
        ? `Tasks in ${activeProject.name}`
        : "Project tasks",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Tasks" },
      ],
    })
  }, [setConfig, activeProject])

  const distinctProjects = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) set.add(t.projectId)
    return set.size
  }, [tasks])

  const todoCount = useMemo(
    () => tasks.filter((t) => t.status === "todo").length,
    [tasks]
  )
  const inProgressCount = useMemo(
    () => tasks.filter((t) => t.status === "in_progress").length,
    [tasks]
  )
  const doneCount = useMemo(
    () => tasks.filter((t) => t.status === "done").length,
    [tasks]
  )

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button
            onClick={refetch}
            className="ml-2 font-medium underline underline-offset-2 transition-colors hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={isLoading ? "—" : tasks.length}
          icon={<ListChecksIcon className="size-4" />}
          description="Across all projects"
        />
        <StatCard
          label="Todo"
          value={isLoading ? "—" : todoCount}
          icon={<ListChecksIcon className="size-4" />}
          description="Awaiting action"
        />
        <StatCard
          label="In Progress"
          value={isLoading ? "—" : inProgressCount}
          icon={<ListChecksIcon className="size-4" />}
          description="Being worked on"
        />
        <StatCard
          label="Done"
          value={isLoading ? "—" : doneCount}
          icon={<ListChecksIcon className="size-4" />}
          description="Completed"
        />
      </div>

      {/* Filters + Kanban */}
      <div className="flex flex-col gap-3">
        <TaskFilters
          filters={filters}
          activeFilterCount={activeFilterCount}
          projects={projects}
          setFilter={setFilter}
          clearFilters={clearFilters}
        />

        {!isLoading && tasks.length === 0 && !error ? (
          <TaskEmptyState />
        ) : (
          <TaskKanban tasks={filtered} />
        )}
      </div>
    </div>
  )
}
