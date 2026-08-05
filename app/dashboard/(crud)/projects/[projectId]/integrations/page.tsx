"use client"

import { use, useState } from "react"
import {
  PlugIcon,
  PlusIcon,
  WarningIcon,
  GitBranchIcon,
  TrashIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useProjectIntegrations } from "@/hooks/use-project-integrations"
import { ConnectGitHubDialog } from "@/components/dashboard/connect-github-dialog"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { toast } from "sonner"

function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    github: "GitHub",
    gitlab: "GitLab",
    slack: "Slack",
    jira: "Jira",
  }
  return labels[provider] ?? provider
}

export default function ProjectIntegrationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <ProjectIntegrationsInner projectId={projectId} />
}

function ProjectIntegrationsInner({ projectId }: { projectId: string }) {
  const { project } = useProject(projectId)
  const {
    integrations,
    isLoading,
    error,
    refetch,
    setEnabled,
    deleteIntegration,
  } = useProjectIntegrations(projectId)
  const [connectOpen, setConnectOpen] = useState(false)

  if (project) {
    useDashboardConfigStore.setState({
      actions: (
        <Button size="sm" onClick={() => setConnectOpen(true)}>
          <PlusIcon className="size-3.5" />
          Connect GitHub
        </Button>
      ),
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project.name, href: `/dashboard/projects/${projectId}` },
        { label: "Integrations" },
      ],
    })
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    const ok = await setEnabled(id, enabled)
    if (ok)
      toast.success(enabled ? "Integration enabled" : "Integration disabled")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this integration?")) return
    const ok = await deleteIntegration(id)
    if (ok) toast.success("Integration removed")
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <WarningIcon className="size-3.5 shrink-0" />
          <span>{error}</span>
          <button onClick={refetch} className="ml-auto underline">
            Retry
          </button>
        </div>
      )}

      {integrations.length === 0 ? (
        <Empty className="rounded-lg border border-border/40 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PlugIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No integrations</EmptyTitle>
            <EmptyDescription>
              Connect GitHub so agents can open PRs and push code for this
              project.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="mt-4" onClick={() => setConnectOpen(true)}>
            <GitBranchIcon className="size-3.5" />
            Connect GitHub
          </Button>
        </Empty>
      ) : (
        <div className="divide-y divide-border/30 rounded-xl border border-border/40 bg-card">
          {integrations.map((intg) => (
            <div key={intg.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                <GitBranchIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{intg.name}</p>
                  <Badge variant="outline" className="h-5 text-[10px]">
                    {providerLabel(intg.provider)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Updated <TimeAgo date={intg.updatedAt} />
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {intg.enabled ? "On" : "Off"}
                  </span>
                  <Switch
                    checked={intg.enabled}
                    onCheckedChange={(v: boolean) => handleToggle(intg.id, v)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(intg.id)}
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {project && (
        <ConnectGitHubDialog
          open={connectOpen}
          onOpenChange={setConnectOpen}
          projects={[
            { id: project.id, name: project.name, slug: project.slug },
          ]}
          defaultProjectId={projectId}
        />
      )}
    </div>
  )
}
