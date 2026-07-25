"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import {
  FolderIcon,
  KeyIcon,
  ClockCounterClockwiseIcon,
  PlusIcon,
  StackSimpleIcon,
  ClipboardTextIcon as EmptyIcon,
} from "@phosphor-icons/react"

import { useSession } from "@/lib/auth-client"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjects } from "@/hooks/use-projects"
import { useGlobalSecrets } from "@/hooks/use-global-secrets"
import { useAuditLogs } from "@/hooks/use-audit-logs"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  const { setConfig } = useDashboardConfig()
  const { data: sessionData } = useSession()
  const { projects, isLoading: projectsLoading } = useProjects()
  const { secrets, isLoading: secretsLoading } = useGlobalSecrets()
  const { logs, isLoading: logsLoading } = useAuditLogs()

  const user = sessionData?.user

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs])
  const totalEnvironments = useMemo(
    () => projects.reduce((sum, p) => sum + p.environments.length, 0),
    [projects]
  )

  useEffect(() => {
    setConfig({
      title: "Dashboard",
      description: "Overview of your workspace",
      breadcrumbs: [{ label: "Dashboard" }],
    })
  }, [setConfig])

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s an overview of your workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={projectsLoading ? "—" : projects.length}
          icon={<FolderIcon className="size-4" />}
          description={projects.length === 1 ? "1 project" : `${projects.length} projects`}
        />
        <StatCard
          label="Secrets"
          value={secretsLoading ? "—" : secrets.length}
          icon={<KeyIcon className="size-4" />}
          description="Across all environments"
        />
        <StatCard
          label="Environments"
          value={projectsLoading ? "—" : totalEnvironments}
          icon={<StackSimpleIcon className="size-4" />}
          description="Across all projects"
        />
        <StatCard
          label="Recent Activity"
          value={logsLoading ? "—" : logs.length}
          icon={<ClockCounterClockwiseIcon className="size-4" />}
          description="Total audit events"
        />
      </div>

      {/* Two-column layout: Activity + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/audit-logs">
                  View all
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md border border-border/30 px-3 py-2"
                  >
                    <div className="size-6 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                      <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                  <EmptyIcon className="size-5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  No activity yet. Things will show up here as your team uses Nimbus.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/30">
                {recentLogs.map((log) => {
                  const meta = log.metadata ?? {}
                  const resourceName =
                    (meta.name as string) ??
                    (meta.projectName as string) ??
                    (meta.secretName as string) ??
                    log.resourceType

                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <ClockCounterClockwiseIcon className="size-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-foreground">
                          <span className="text-muted-foreground">{log.action.replace(/_/g, " ")}</span>{" "}
                          <span className="font-medium">{resourceName}</span>
                        </p>
                      </div>
                      <TimeAgo date={log.createdAt} className="shrink-0" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/dashboard/projects">
                  <PlusIcon className="size-3.5" />
                  Create Project
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/dashboard/secrets">
                  <KeyIcon className="size-3.5" />
                  View Secrets
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/dashboard/organizations">
                  <FolderIcon className="size-3.5" />
                  Manage Organizations
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start gap-2">
                <Link href="/dashboard/audit-logs">
                  <ClockCounterClockwiseIcon className="size-3.5" />
                  Audit Logs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
