"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import {
  RobotIcon,
  KeyIcon,
  PlugIcon,
  LightningIcon,
  ShieldCheckIcon,
  ClockCounterClockwiseIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  SpinnerGapIcon,
  ArrowRightIcon,
  LockSimpleIcon,
  ChatTeardropTextIcon,
} from "@phosphor-icons/react"

import { useSession } from "@/lib/auth-client"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjects } from "@/hooks/use-projects"
import { useGlobalSecrets } from "@/hooks/use-global-secrets"
import { useGlobalIntegrations } from "@/hooks/use-global-integrations"
import { useAuditLogs } from "@/hooks/use-audit-logs"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useWorkspacePanel } from "@/context/workspace-panel"

const MOCK_AGENT_ACTIVITY = [
  {
    agent: "Coding Agent",
    action: "Scaffolded Next.js landing page, pushed to main branch",
    status: "completed",
    time: "2h ago",
    color: "text-blue-400",
  },
  {
    agent: "Ops Agent",
    action: "Sent weekly deployment summary to #engineering",
    status: "completed",
    time: "5h ago",
    color: "text-amber-400",
  },
  {
    agent: "Content Agent",
    action: "Q3 newsletter draft ready — awaiting approval",
    status: "awaiting_approval",
    time: "1d ago",
    color: "text-violet-400",
  },
]

function AgentStatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircleIcon className="size-3.5 text-emerald-400 shrink-0" />
  if (status === "running") return <SpinnerGapIcon className="size-3.5 text-blue-400 shrink-0 animate-spin" />
  if (status === "awaiting_approval") return <WarningCircleIcon className="size-3.5 text-amber-400 shrink-0" />
  return null
}

export default function DashboardPage() {
  const { setConfig } = useDashboardConfig()
  const { data: sessionData } = useSession()
  const { projects, isLoading: projectsLoading } = useProjects()
  const { secrets, isLoading: secretsLoading } = useGlobalSecrets()
  const { logs, isLoading: logsLoading } = useAuditLogs()
  const { integrations, isLoading: integrationsLoading } = useGlobalIntegrations()
  const { openChat } = useWorkspacePanel()

  const user = sessionData?.user
  const firstName = user?.name?.split(" ")[0] ?? null
  const recentLogs = useMemo(() => logs.slice(0, 3), [logs])
  const connectedCount = integrations.filter((i) => i.enabled).length

  useEffect(() => {
    setConfig({
      title: "Dashboard",
      description: "Your autonomous operations command center",
      breadcrumbs: [{ label: "Dashboard" }],
    })
  }, [setConfig])

  return (
    <div className="flex flex-col gap-6">

      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-br from-primary/8 via-background to-background p-5 md:p-6">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-8 w-32 h-32 bg-violet-500/6 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your autonomous engine is online. What should we tackle today?
            </p>
          </div>
          <Button className="gap-2 font-semibold shrink-0 shadow-lg shadow-primary/20" onClick={openChat}>
            <LightningIcon className="size-4" />
            Launch Agent
          </Button>
        </div>
      </div>

      {/* Command Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={openChat}
          className="group flex flex-col gap-3 p-4 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <RobotIcon className="size-5" weight="duotone" />
            </div>
            <ArrowRightIcon className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Launch Agent</p>
            <p className="text-xs text-muted-foreground mt-0.5">Delegate a task to an AI agent</p>
          </div>
        </button>

        <Link
          href="/dashboard/secrets"
          className="group flex flex-col gap-3 p-4 rounded-xl border border-cyan-500/25 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              <KeyIcon className="size-5" weight="duotone" />
            </div>
            <ArrowRightIcon className="size-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Open Vault</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {secretsLoading ? "Loading…" : `${secrets.length} encrypted secrets`}
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/integrations"
          className="group flex flex-col gap-3 p-4 rounded-xl border border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
              <PlugIcon className="size-5" weight="duotone" />
            </div>
            <ArrowRightIcon className="size-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Connect Tool</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {integrationsLoading ? "Loading…" : `${connectedCount} tool${connectedCount !== 1 ? "s" : ""} connected`}
            </p>
          </div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Agent Activity + System Logs */}
        <Card className="lg:col-span-2 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RobotIcon className="size-4 text-primary" weight="duotone" />
                <CardTitle className="text-sm">Agent Activity</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/dashboard/agents">View agents</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {MOCK_AGENT_ACTIVITY.map((run, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <AgentStatusIcon status={run.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide", run.color)}>
                      {run.agent}
                    </span>
                    {run.status === "awaiting_approval" && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
                        Needs Review
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{run.action}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{run.time}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-border/30 mt-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-3 pb-2">System Activity</p>
              {logsLoading ? (
                <div className="space-y-2 px-3">
                  {[0,1].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="size-3.5 animate-pulse rounded-full bg-muted" />
                      <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : recentLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 italic">No recent activity.</p>
              ) : (
                recentLogs.map((log) => {
                  const meta = log.metadata ?? {}
                  const resourceName =
                    (meta.name as string) ??
                    (meta.projectName as string) ??
                    (meta.secretName as string) ??
                    log.resourceType
                  return (
                    <div key={log.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors">
                      <ClockCounterClockwiseIcon className="size-3.5 text-muted-foreground shrink-0" />
                      <p className="flex-1 min-w-0 text-xs text-muted-foreground truncate">
                        <span>{log.action.replace(/_/g, " ")}</span>
                        {" · "}
                        <span className="text-foreground font-medium">{resourceName}</span>
                      </p>
                      <TimeAgo date={log.createdAt} className="shrink-0 text-[10px]" />
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vault Health */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-cyan-400" weight="duotone" />
              <CardTitle className="text-sm">Vault Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <LockSimpleIcon className="size-4 text-emerald-400" weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">Zero-Leak Active</p>
                <p className="text-[10px] text-muted-foreground">Agent proxy secured</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: secretsLoading ? "—" : secrets.length, label: "Secrets" },
                { value: projectsLoading ? "—" : projects.length, label: "Projects" },
                { value: integrationsLoading ? "—" : connectedCount, label: "Tools" },
                { value: "AES-256", label: "Encryption" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border/30 bg-muted/20 p-2.5 text-center">
                  <p className="text-lg font-black text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" asChild className="justify-start gap-2 h-8 text-xs">
                <Link href="/dashboard/secrets">
                  <KeyIcon className="size-3.5 text-cyan-400" />
                  Manage Secrets
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="justify-start gap-2 h-8 text-xs">
                <Link href="/dashboard/audit-logs">
                  <ClockCounterClockwiseIcon className="size-3.5 text-muted-foreground" />
                  Audit Logs
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs" onClick={openChat}>
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
