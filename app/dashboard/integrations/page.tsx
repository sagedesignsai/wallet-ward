"use client"

import { useEffect, useMemo, useState } from "react"
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
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { ConnectIntegrationDialog } from "@/components/dashboard/connect-integration-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export default function GlobalIntegrationsPage() {
  const { setConfig } = useDashboardConfig()
  const {
    integrations, filtered, isLoading, error, filters,
    activeFilterCount, projects, providers,
    setFilter, clearFilters, refetch,
  } = useGlobalIntegrations()
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<"github" | "gmail" | "slack" | "gitlab" | "linear" | "jira" | "notion" | "airtable" | "trello">("github")

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

  const distinctProjects = useMemo(() => {
    const set = new Set<string>()
    for (const i of integrations) set.add(i.projectId)
    return set.size
  }, [integrations])

  const enabledCount = useMemo(
    () => integrations.filter((i) => i.enabled).length,
    [integrations]
  )

  const columns: DataTableColumn<GlobalIntegration & Record<string, unknown>>[] =
    useMemo(() => [
      {
        key: "provider",
        header: "Provider",
        className: "w-[200px]",
        render: (row) => {
          const intg = row as unknown as GlobalIntegration
          const Icon = providerIcon(intg.provider)
          return (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
                <Icon className="size-3" />
              </div>
              <div className="min-w-0">
                <span className="font-medium text-foreground truncate block">{intg.name}</span>
                <span className="text-[0.625rem] text-muted-foreground truncate block">
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
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
        key: "updatedAt",
        header: "Updated",
        className: "w-[100px]",
        render: (row) => {
          const intg = row as unknown as GlobalIntegration
          return <TimeAgo date={intg.updatedAt} />
        },
      },
    ], [])

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button onClick={refetch} className="ml-2 font-medium underline underline-offset-2 hover:text-destructive/80 transition-colors">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Integrations" value={isLoading ? "—" : integrations.length} icon={<PlugIcon className="size-4" />} description="Across all projects" />
        <StatCard label="Enabled" value={isLoading ? "—" : enabledCount} icon={<PlugIcon className="size-4" />} description="Currently active" />
        <StatCard label="Projects" value={isLoading ? "—" : distinctProjects} icon={<FolderIcon className="size-4" />} description={distinctProjects === 1 ? "1 project" : `${distinctProjects} projects`} />
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Input placeholder="Search integrations..." value={filters.search} onChange={(e) => setFilter("search", e.target.value)} className="max-w-xs h-8 text-xs" />
          <Select value={filters.projectId ?? "__all__"} onValueChange={(val: string) => setFilter("projectId", val === "__all__" ? null : val)}>
            <SelectTrigger size="sm" className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.provider ?? "__all__"} onValueChange={(val: string) => setFilter("provider", val === "__all__" ? null : val)}>
            <SelectTrigger size="sm" className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p} value={p}>{providerLabel(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
          )}
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => { setSelectedProvider("jira"); setConnectDialogOpen(true); }}>
              Connect Jira
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedProvider("notion"); setConnectDialogOpen(true); }}>
              Connect Notion
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedProvider("airtable"); setConnectDialogOpen(true); }}>
              Connect Airtable
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedProvider("trello"); setConnectDialogOpen(true); }}>
              Connect Trello
            </Button>
            <Button size="sm" onClick={() => { setSelectedProvider("github"); setConnectDialogOpen(true); }}>
              <GitBranchIcon /> Connect GitHub
            </Button>
          </div>
        </div>

        {!isLoading && integrations.length === 0 && !error ? (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
            <div className="flex flex-col items-center gap-4 py-12 px-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary ring-1 ring-primary/10 transition-transform hover:scale-105">
                <FolderOpenIcon className="size-7" weight="light" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-foreground">No integrations yet</h3>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Connect your first integration to a project to get started.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => { setSelectedProvider("jira"); setConnectDialogOpen(true); }}>
                  Jira
                </Button>
                <Button variant="outline" onClick={() => { setSelectedProvider("notion"); setConnectDialogOpen(true); }}>
                  Notion
                </Button>
                <Button variant="outline" onClick={() => { setSelectedProvider("airtable"); setConnectDialogOpen(true); }}>
                  Airtable
                </Button>
                <Button variant="outline" onClick={() => { setSelectedProvider("trello"); setConnectDialogOpen(true); }}>
                  Trello
                </Button>
                <Button variant="outline" onClick={() => { setSelectedProvider("github"); setConnectDialogOpen(true); }}>
                  <GitBranchIcon /> GitHub
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns as DataTableColumn<Record<string, unknown>>[]}
            data={filtered as (GlobalIntegration & Record<string, unknown>)[]}
            isLoading={isLoading}
            loadingRows={5}
            keyExtractor={(i) => String((i as unknown as GlobalIntegration).id)}
            onRowClick={(row) => {
              const intg = row as unknown as GlobalIntegration
              window.location.href = `/dashboard/projects/${intg.projectId}`
            }}
            emptyTitle={activeFilterCount > 0 ? "No integrations match your filters" : "No integrations found"}
            emptyDescription={activeFilterCount > 0 ? "Try adjusting or clearing your filters." : "No integrations are available to display."}
            emptyIcon={activeFilterCount > 0 ? <WarningCircleIcon /> : <PlugIcon />}
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
