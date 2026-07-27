"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import {
  PlugIcon,
  FolderIcon,
  FolderOpenIcon,
  WarningCircleIcon,
  GitBranchIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import {
  useGlobalIntegrations,
  type GlobalIntegration,
} from "@/hooks/use-global-integrations"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/data-table"
import { ConnectIntegrationDialog } from "@/components/dashboard/connect-integration-dialog"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function providerIcon(provider: string) {
  switch (provider) {
    case "github":
    case "gitlab":
      return GitBranchIcon
    case "slack":
      return PlugIcon
    case "gmail":
      return PlugIcon
    case "linear":
      return PlugIcon
    default:
      return PlugIcon
  }
}

function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    github: "GitHub",
    gitlab: "GitLab",
    gmail: "Gmail",
    slack: "Slack",
    linear: "Linear",
    jira: "Jira",
    notion: "Notion",
    airtable: "Airtable",
    trello: "Trello",
  }
  return labels[provider] ?? provider
}

type HealthStatus = {
  status: "healthy" | "expiring_soon" | "expired" | "no_token"
  message: string
}

const HEALTH_CONFIG: Record<string, { label: string; className: string }> = {
  healthy: {
    label: "Healthy",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  expiring_soon: {
    label: "Expiring",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  expired: {
    label: "Expired",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  no_token: {
    label: "No Token",
    className: "bg-muted/60 text-muted-foreground border-border/40",
  },
}

export default function GlobalIntegrationsPage() {
  const { setConfig } = useDashboardConfig()
  const router = useRouter()
  const {
    integrations,
    filtered,
    isLoading,
    error,
    filters,
    activeFilterCount,
    projects,
    providers,
    setFilter,
    clearFilters,
    refetch,
  } = useGlobalIntegrations()
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<
    | "github"
    | "gmail"
    | "slack"
    | "gitlab"
    | "linear"
    | "jira"
    | "notion"
    | "airtable"
    | "trello"
  >("github")
  const [healthMap, setHealthMap] = useState<Record<string, HealthStatus>>({})
  const [healthLoading, setHealthLoading] = useState(false)

  useEffect(() => {
    setConfig({
      title: "Integrations",
      description: "All integrations across your projects",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Integrations" },
      ],
    })
  }, [setConfig])

  // Fetch health for all integrations
  useEffect(() => {
    if (integrations.length === 0) return
    let cancelled = false

      ; (async () => {
        setHealthLoading(true)
        const results = await Promise.allSettled(
          integrations.map(async (intg) => {
            const res = await fetch(`/api/v1/integrations/${intg.id}/health`, {
              credentials: "include",
            })
            if (!res.ok) throw new Error(`${res.status}`)
            const body: { status: HealthStatus["status"]; message: string } =
              await res.json()
            return { id: intg.id, status: body.status, message: body.message }
          })
        )
        if (cancelled) return
        const map: Record<string, HealthStatus> = {}
        for (const r of results) {
          if (r.status === "fulfilled") {
            map[r.value.id] = { status: r.value.status, message: r.value.message }
          }
        }
        setHealthMap(map)
        setHealthLoading(false)
      })()

    return () => {
      cancelled = true
    }
  }, [integrations])

  const distinctProjects = useMemo(() => {
    const set = new Set<string>()
    for (const i of integrations) set.add(i.projectId)
    return set.size
  }, [integrations])

  const enabledCount = useMemo(
    () => integrations.filter((i) => i.enabled).length,
    [integrations]
  )

  const columns: DataTableColumn<
    GlobalIntegration & Record<string, unknown>
  >[] = useMemo(
    () => [
      {
        key: "provider",
        header: "Provider",
        className: "w-[200px]",
        render: (row) => {
          const intg = row as unknown as GlobalIntegration
          const Icon = providerIcon(intg.provider)
          return (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
                <Icon className="size-3" />
              </div>
              <div className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {intg.name}
                </span>
                <span className="block truncate text-[0.625rem] text-muted-foreground">
                  {providerLabel(intg.provider)}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        key: "project",
        header: "Project",
        className: "w-[160px]",
        render: (row) => {
          const intg = row as unknown as GlobalIntegration
          return (
            <Link
              href={`/dashboard/projects/${intg.projectId}/integrations`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderIcon className="size-3 shrink-0" />
              <span className="truncate">{intg.project.name}</span>
            </Link>
          )
        },
      },
      {
        key: "enabled",
        header: "Status",
        className: "w-[100px]",
        render: (row) => {
          const intg = row as unknown as GlobalIntegration
          return (
            <Badge variant={intg.enabled ? "default" : "secondary"}>
              {intg.enabled ? "Enabled" : "Disabled"}
            </Badge>
          )
        },
      },
      {
        key: "health",
        header: "Health",
        className: "w-[110px]",
        render: (row) => {
          const intg = row as unknown as GlobalIntegration
          const health = healthMap[intg.id]
          if (!health && healthLoading) {
            return <Skeleton className="h-5 w-16" />
          }
          if (!health) {
            return (
              <Badge
                variant="outline"
                className="border-border/40 bg-muted/60 text-muted-foreground"
              >
                Unknown
              </Badge>
            )
          }
          const config = HEALTH_CONFIG[health.status] ?? HEALTH_CONFIG.no_token
          return (
            <Badge
              variant="outline"
              className={config.className}
              title={health.message}
            >
              {config.label}
            </Badge>
          )
        },
      },
      {
        key: "updatedAt",
        header: "Updated",
        className: "w-[100px]",
        render: (row) => {
          const intg = row as unknown as GlobalIntegration
          return <TimeAgo date={intg.updatedAt} />
        },
      },
    ],
    [healthMap, healthLoading]
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Integrations"
          value={isLoading ? "—" : integrations.length}
          icon={<PlugIcon className="size-4" />}
          description="Across all projects"
        />
        <StatCard
          label="Enabled"
          value={isLoading ? "—" : enabledCount}
          icon={<PlugIcon className="size-4" />}
          description="Currently active"
        />
        <StatCard
          label="Projects"
          value={isLoading ? "—" : distinctProjects}
          icon={<FolderIcon className="size-4" />}
          description={
            distinctProjects === 1
              ? "1 project"
              : `${distinctProjects} projects`
          }
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search integrations..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="h-8 max-w-xs text-xs"
          />
          <Select
            value={filters.projectId ?? "__all__"}
            onValueChange={(val: string) =>
              setFilter("projectId", val === "__all__" ? null : val)
            }
          >
            <SelectTrigger size="sm" className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.provider ?? "__all__"}
            onValueChange={(val: string) =>
              setFilter("provider", val === "__all__" ? null : val)
            }
          >
            <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p} value={p}>
                  {providerLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProvider("jira")
                setConnectDialogOpen(true)
              }}
            >
              Connect Jira
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProvider("notion")
                setConnectDialogOpen(true)
              }}
            >
              Connect Notion
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProvider("airtable")
                setConnectDialogOpen(true)
              }}
            >
              Connect Airtable
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProvider("trello")
                setConnectDialogOpen(true)
              }}
            >
              Connect Trello
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedProvider("github")
                setConnectDialogOpen(true)
              }}
            >
              <GitBranchIcon /> Connect GitHub
            </Button>
          </div>
        </div>

        {!isLoading && integrations.length === 0 && !error ? (
          <Empty className="rounded-lg border border-border/60 bg-card py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpenIcon className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No integrations yet</EmptyTitle>
              <EmptyDescription>
                Connect your first integration to a project to get started.
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  setSelectedProvider("jira")
                  setConnectDialogOpen(true)
                }}
              >
                Jira
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProvider("notion")
                  setConnectDialogOpen(true)
                }}
              >
                Notion
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProvider("airtable")
                  setConnectDialogOpen(true)
                }}
              >
                Airtable
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProvider("trello")
                  setConnectDialogOpen(true)
                }}
              >
                Trello
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProvider("github")
                  setConnectDialogOpen(true)
                }}
              >
                <GitBranchIcon /> GitHub
              </Button>
            </div>
          </Empty>
        ) : (
          <DataTable
            columns={columns as DataTableColumn<Record<string, unknown>>[]}
            data={filtered as (GlobalIntegration & Record<string, unknown>)[]}
            isLoading={isLoading}
            loadingRows={5}
            keyExtractor={(i) => String((i as unknown as GlobalIntegration).id)}
            onRowClick={(row) => {
              const intg = row as unknown as GlobalIntegration
              router.push(`/dashboard/projects/${intg.projectId}`)
            }}
            emptyTitle={
              activeFilterCount > 0
                ? "No integrations match your filters"
                : "No integrations found"
            }
            emptyDescription={
              activeFilterCount > 0
                ? "Try adjusting or clearing your filters."
                : "No integrations are available to display."
            }
            emptyIcon={
              activeFilterCount > 0 ? <WarningCircleIcon /> : <PlugIcon />
            }
          />
        )}
      </div>

      <ConnectIntegrationDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        projects={projects}
        provider={selectedProvider}
      />
    </div>
  )
}
