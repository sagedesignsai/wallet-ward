"use client"

import React, { use } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  ClockCounterClockwiseIcon,
  FolderOpenIcon,
  StackSimpleIcon,
  RobotIcon,
  CheckCircleIcon,
  PlugIcon,
  ListChecksIcon,
  FileTextIcon,
  KeyIcon,
  WarningCircleIcon,
  ShieldCheckIcon,
  GitBranchIcon,
  FolderIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import {
  useAgentSessions,
  type AgentSessionDto,
} from "@/hooks/use-agent-sessions"
import { useProposals } from "@/hooks/use-proposals"
import { useProjectIntegrations } from "@/hooks/use-project-integrations"
import { useSecrets } from "@/hooks/use-secrets"
import { useDocuments } from "@/hooks/use-documents"
import { useTasks } from "@/hooks/use-tasks"
import { useRepositories } from "@/hooks/use-repositories"
import { useProjectFiles } from "@/hooks/use-project-files"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { AgentSessionRow } from "@/components/agents/agent-session-row"
import { ApprovalCard } from "@/components/proposals/approval-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const { project, isLoading, error } = useProject(projectId)
  const { sessions } = useAgentSessions({ projectId, limit: 5 })
  const { proposals } = useProposals({
    projectId,
    status: "awaiting_approval" as any,
    orgWide: false,
  })
  const { integrations } = useProjectIntegrations(projectId)
  const { secrets } = useSecrets(projectId, "")
  const { documents } = useDocuments(projectId)
  const { tasks } = useTasks(projectId)
  const { repositories } = useRepositories(projectId)
  const { files } = useProjectFiles(projectId)

  if (project) {
    useDashboardConfigStore.setState({
      title: project.name,
      description: project.description ?? "No description",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project.name },
      ],
    })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-[140px] rounded-lg" />
          <Skeleton className="h-[140px] rounded-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[100px] rounded-lg" />
          <Skeleton className="h-[100px] rounded-lg" />
          <Skeleton className="h-[100px] rounded-lg" />
          <Skeleton className="h-[100px] rounded-lg" />
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
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {error ??
              "This project may have been deleted or you may not have access."}
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="text-xs text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
        >
          Back to Projects
        </Link>
      </div>
    )
  }

  const environments = project.environments ?? []
  const activeSessions =
    sessions?.filter((s: { status: string }) => s.status === "active") ?? []
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress")
  const doneTasks = tasks.filter((t) => t.status === "done")
  const connectedIntegrations = integrations.filter((i) => i.enabled)

  return (
    <div className="flex animate-in flex-col gap-6 duration-300 fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/8 via-background to-background p-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute right-8 bottom-0 h-32 w-32 rounded-full bg-violet-500/6 blur-2xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <StackSimpleIcon className="size-6" weight="duotone" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {project.name}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {project.description ?? "No description provided"}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ClockCounterClockwiseIcon className="size-3" />
                    Created <TimeAgo date={project.createdAt} />
                  </span>
                  <span>·</span>
                  <span className="font-mono">{project.slug}</span>
                </div>
              </div>
            </div>
            <Button size="sm" asChild>
              <Link href={`/dashboard/projects/${projectId}/settings`}>
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Secrets & Keys"
          value={secrets.length}
          icon={<KeyIcon className="size-4" />}
          description={
            secrets.length === 1 ? "1 secret" : `${secrets.length} secrets`
          }
        />
        <StatCard
          label="Documents"
          value={documents.length}
          icon={<FileTextIcon className="size-4" />}
          description={
            documents.length === 1
              ? "1 document"
              : `${documents.length} documents`
          }
        />
        <StatCard
          label="Tasks"
          value={tasks.length}
          icon={<ListChecksIcon className="size-4" />}
          description={`${todoTasks.length} todo · ${inProgressTasks.length} active`}
        />
        <StatCard
          label="Integrations"
          value={connectedIntegrations.length}
          icon={<PlugIcon className="size-4" />}
          description={`${connectedIntegrations.length} of ${integrations.length} connected`}
        />
      </div>

      {/* Pending Approvals Alert */}
      {proposals.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <WarningCircleIcon
                className="size-5 text-amber-400"
                weight="fill"
              />
              <CardTitle className="text-sm text-amber-400">
                {proposals.length} Pending Approval
                {proposals.length > 1 ? "s" : ""}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposals.slice(0, 2).map((proposal) => (
              <ApprovalCard
                key={proposal.id}
                proposal={proposal}
                className="text-xs"
              />
            ))}
            {proposals.length > 2 && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/dashboard/projects/${projectId}/proposals`}>
                  View all {proposals.length} proposals
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Active Agents */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RobotIcon className="size-4 text-primary" weight="duotone" />
                <CardTitle className="text-sm">Active Agents</CardTitle>
                {activeSessions.length > 0 && (
                  <Badge variant="secondary">{activeSessions.length}</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href={`/dashboard/projects/${projectId}/agents`}>
                  View all
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="py-6 text-center">
                <RobotIcon className="mx-auto mb-2 size-10 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  No active agents
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSessions.map((session: AgentSessionDto) => (
                  <AgentSessionRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StackSimpleIcon
                  className="size-4 text-blue-400"
                  weight="duotone"
                />
                <CardTitle className="text-sm">Environments</CardTitle>
                <Badge variant="secondary">{environments.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href={`/dashboard/projects/${projectId}/environments`}>
                  Manage
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {environments.length === 0 ? (
              <div className="py-6 text-center">
                <StackSimpleIcon className="mx-auto mb-2 size-10 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  No environments yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {environments.map((env) => (
                  <Link
                    key={env.id}
                    href={`/dashboard/projects/${projectId}/environments/${env.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg border border-l-[3px] bg-gradient-to-r p-3 transition-colors hover:bg-accent",
                      envGradient(env.slug)
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {env.name}
                      </span>
                      <Badge
                        variant={envBadgeVariant(env.slug)}
                        className="shrink-0"
                      >
                        {env.slug}
                      </Badge>
                    </div>
                    <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {[
            {
              href: `/dashboard/projects/${projectId}/secrets`,
              label: "Secrets",
              icon: KeyIcon,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
              count: secrets.length,
            },
            {
              href: `/dashboard/projects/${projectId}/documents`,
              label: "Documents",
              icon: FileTextIcon,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              count: documents.length,
            },
            {
              href: `/dashboard/projects/${projectId}/tasks`,
              label: "Tasks",
              icon: ListChecksIcon,
              color: "text-violet-400",
              bg: "bg-violet-500/10",
              count: tasks.length,
            },
            {
              href: `/dashboard/projects/${projectId}/integrations`,
              label: "Integrations",
              icon: PlugIcon,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              count: connectedIntegrations.length,
            },
            {
              href: `/dashboard/projects/${projectId}/repositories`,
              label: "Repositories",
              icon: GitBranchIcon,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              count: repositories.length,
            },
            {
              href: `/dashboard/projects/${projectId}/files`,
              label: "Files",
              icon: FolderIcon,
              color: "text-orange-400",
              bg: "bg-orange-500/10",
              count: files.length,
            },
            {
              href: `/dashboard/projects/${projectId}/settings`,
              label: "Settings",
              icon: ShieldCheckIcon,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
              count: null,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-xl border border-border/40 bg-card p-4 transition-all duration-200 hover:border-border/60 hover:bg-accent"
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  item.bg
                )}
              >
                <item.icon
                  className={cn("size-5", item.color)}
                  weight="duotone"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                {item.count !== null && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.count} {item.count === 1 ? "item" : "items"}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
