"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  PlusIcon,
  RobotIcon,
  WarningIcon,
  LightningIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useAgentSessions } from "@/hooks/use-agent-sessions"
import { useWorkspacePanelStore } from "@/stores/workspace-panel-store"
import { AgentSessionRow } from "@/components/agents/agent-session-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import type { AgentType } from "@/hooks/use-agent-sessions"

export default function ProjectAgentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <ProjectAgentsInner projectId={projectId} />
}

function ProjectAgentsInner({ projectId }: { projectId: string }) {
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const { sessions, isLoading, error, createSession, refetch } =
    useAgentSessions({ projectId, polling: true })
  const launchAgent = useWorkspacePanelStore((s) => s.launchAgent)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<AgentType>("coding")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setConfig({
        description: `${project.name} — ${sessions.length} agent session${sessions.length !== 1 ? "s" : ""}`,
        actions: (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => launchAgent("coding")}
            >
              <LightningIcon className="size-3.5" />
              Quick Launch
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <PlusIcon className="size-3.5" />
              New Session
            </Button>
          </div>
        ),
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          { label: project.name, href: `/dashboard/projects/${projectId}` },
          { label: "Agents" },
        ],
      })
    }
  }, [project, sessions.length, setConfig, projectId, launchAgent])

  const handleCreate = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    const session = await createSession({
      projectId,
      name: name.trim(),
      type,
    })
    setSubmitting(false)
    if (session) {
      setDialogOpen(false)
      setName("")
      setType("coding")
      launchAgent(type)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
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

      {sessions.length === 0 ? (
        <Empty className="rounded-lg border border-border/40 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RobotIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No agent sessions</EmptyTitle>
            <EmptyDescription>
              Launch an agent to start autonomous work on this project.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <PlusIcon className="size-3.5" />
            New Session
          </Button>
        </Empty>
      ) : (
        <div className="divide-y divide-border/30 rounded-xl border border-border/40 bg-card">
          {sessions.map((session) => (
            <AgentSessionRow key={session.id} session={session} />
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Full agent catalog in{" "}
        <Link href="/dashboard/agents" className="text-primary hover:underline">
          Agent Hub
        </Link>
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Agent Session</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-name">Name</Label>
              <Input
                id="session-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Landing page build"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Agent type</Label>
              <Select
                value={type}
                onValueChange={(v: string) => setType(v as AgentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="ops">Ops</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || submitting}
            >
              Create & Launch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
