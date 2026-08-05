"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  RobotIcon,
  KeyIcon,
  PlugIcon,
  LightningIcon,
  ShieldCheckIcon,
  ClockCounterClockwiseIcon,
  ArrowRightIcon,
  LockSimpleIcon,
  ChatTeardropTextIcon,
} from "@phosphor-icons/react"

import { useSession } from "@/lib/auth-client"
import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProjects } from "@/hooks/use-projects"
import { useWorkspaceNavigation } from "@/hooks/use-workspace-navigation"
import { useGlobalSecrets } from "@/hooks/use-global-secrets"
import { useGlobalIntegrations } from "@/hooks/use-global-integrations"
import { useAuditLogs } from "@/hooks/use-audit-logs"
import { useAgentSessions } from "@/hooks/use-agent-sessions"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { PendingApprovalsWidget } from "@/components/dashboard/pending-approvals-widget"
import { AgentSessionRow } from "@/components/agents/agent-session-row"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function OverviewPage() {
  const { data: sessionData } = useSession()
  const { projects, isLoading: projectsLoading } = useProjects()
  const { secrets, isLoading: secretsLoading } = useGlobalSecrets()
  const { logs, isLoading: logsLoading } = useAuditLogs()
  const { integrations, isLoading: integrationsLoading } =
    useGlobalIntegrations()
  const { sessions, isLoading: sessionsLoading } = useAgentSessions({
    limit: 5,
    polling: true,
  })
  const { openWorkspace } = useWorkspaceNavigation()

  const user = sessionData?.user
  const firstName = user?.name?.split(" ")[0] ?? null
  const recentLogs = useMemo(() => logs.slice(0, 3), [logs])
  const connectedCount = integrations.filter((i) => i.enabled).length

  useDashboardConfigStore.setState({
    title: "Overview",
    breadcrumbs: [{ label: "Overview" }],
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/8 via-background to-background p-5 md:p-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute right-8 bottom-0 h-32 w-32 rounded-full bg-violet-500/6 blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-base font-bold text-foreground">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your autonomous engine is online. What should we tackle today?
            </p>
          </div>
          <Button
            className="shrink-0 gap-2 font-semibold shadow-lg shadow-primary/20"
            onClick={() => openWorkspace()}
          >
            <LightningIcon className="size-4" />
            Launch Agent
          </Button>
        </div>
      </div>

      {/* Command Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => openWorkspace()}
          className="group flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <RobotIcon className="size-5" weight="duotone" />
            </div>
            <ArrowRightIcon className="size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Launch Agent
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Delegate a task to an AI agent
            </p>
          </div>
        </button>

        <Link
          href="/dashboard/secrets"
          className="group flex flex-col gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4 transition-all duration-200 hover:border-cyan-500/40 hover:bg-cyan-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              <KeyIcon className="size-5" weight="duotone" />
            </div>
            <ArrowRightIcon className="size-4 text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Open Vault</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {secretsLoading
                ? "Loading…"
                : `${secrets.length} encrypted secrets`}
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/integrations"
          className="group flex flex-col gap-3 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 transition-all duration-200 hover:border-violet-500/40 hover:bg-violet-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
              <PlugIcon className="size-5" weight="duotone" />
            </div>
            <ArrowRightIcon className="size-4 text-violet-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Connect Tool
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {integrationsLoading
                ? "Loading…"
                : `${connectedCount} tool${connectedCount !== 1 ? "s" : ""} connected`}
            </p>
          </div>
        </Link>
      </div>

      <PendingApprovalsWidget />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RobotIcon className="size-4 text-primary" weight="duotone" />
                <CardTitle className="text-sm">Agent Activity</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/dashboard/sessions">View sessions</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {sessionsLoading ? (
              <div className="space-y-2 px-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-muted/40"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground italic">
                No agent sessions yet. Launch an agent to get started.
              </p>
            ) : (
              <div className="-mx-1 divide-y divide-border/30">
                {sessions.map((session) => (
                  <AgentSessionRow key={session.id} session={session} />
                ))}
              </div>
            )}

            <div className="mt-1 border-t border-border/30 pt-2">
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                System Activity
              </p>
              {logsLoading ? (
                <div className="space-y-2 px-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="size-3.5 animate-pulse rounded-full bg-muted" />
                      <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : recentLogs.length === 0 ? (
                <p className="px-3 text-xs text-muted-foreground italic">
                  No recent activity.
                </p>
              ) : (
                recentLogs.map((log) => {
                  const meta = log.metadata ?? {}
                  const resourceName =
                    (meta.name as string) ??
                    (meta.projectName as string) ??
                    (meta.secretName as string) ??
                    (meta.title as string) ??
                    log.resourceType
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30"
                    >
                      <ClockCounterClockwiseIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        <span>{log.action.replace(/_/g, " ")}</span>
                        {" · "}
                        <span className="font-medium text-foreground">
                          {resourceName}
                        </span>
                      </p>
                      <TimeAgo
                        date={log.createdAt}
                        className="shrink-0 text-[10px]"
                      />
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon
                className="size-4 text-cyan-400"
                weight="duotone"
              />
              <CardTitle className="text-sm">Vault Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <LockSimpleIcon
                  className="size-4 text-emerald-400"
                  weight="duotone"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">
                  Zero-Leak Active
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Agent proxy secured
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: secretsLoading ? "—" : secrets.length,
                  label: "Secrets",
                },
                {
                  value: projectsLoading ? "—" : projects.length,
                  label: "Projects",
                },
                {
                  value: integrationsLoading ? "—" : connectedCount,
                  label: "Tools",
                },
                { value: "AES-256", label: "Encryption" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border/30 bg-muted/20 p-2.5 text-center"
                >
                  <p className="text-lg font-black text-foreground">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 justify-start gap-2 text-xs"
              >
                <Link href="/dashboard/secrets">
                  <KeyIcon className="size-3.5 text-cyan-400" />
                  Manage Secrets
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 justify-start gap-2 text-xs"
              >
                <Link href="/dashboard/audit-logs">
                  <ClockCounterClockwiseIcon className="size-3.5 text-muted-foreground" />
                  Audit Logs
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 justify-start gap-2 text-xs"
                onClick={() => openWorkspace()}
              >
                <ChatTeardropTextIcon className="size-3.5 text-primary" />
                Ask AI Assistant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
