"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  CodeIcon,
  PencilSimpleIcon,
  GearIcon,
  MagnifyingGlassIcon,
  RobotIcon,
  LightningIcon,
  LockSimpleIcon,
  CloudIcon,
  ArrowRightIcon,
  PlusIcon,
  WarningCircleIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useWorkspacePanel } from "@/context/workspace-panel"
import { usePendingApprovals } from "@/hooks/use-pending-approvals"
import { useAgentSessions } from "@/hooks/use-agent-sessions"
import { useSandboxes } from "@/hooks/use-sandboxes"
import { AgentSessionRow, AgentStatusBadge } from "@/components/agents/agent-session-row"

const AGENT_PERSONAS = [
  {
    type: "coding" as const,
    name: "Coding Agent",
    description:
      "Builds, tests, and deploys applications inside isolated Daytona sandboxes. Pushes to GitHub, previews live.",
    icon: CodeIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    glow: "group-hover:shadow-blue-500/15",
    accentBar: "bg-blue-500",
    capabilities: ["Next.js / React", "Daytona Sandbox", "GitHub Push", "Live Preview"],
  },
  {
    type: "content" as const,
    name: "Content Agent",
    description:
      "Drafts blogs, newsletters, social posts, and documentation using your brand context. Publishes to CMS.",
    icon: PencilSimpleIcon,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    glow: "group-hover:shadow-violet-500/15",
    accentBar: "bg-violet-500",
    capabilities: ["Blog Posts", "Newsletters", "Social Copy", "CMS Publish"],
  },
  {
    type: "ops" as const,
    name: "Ops Agent",
    description:
      "Manages tasks, monitors deployments, sends team updates to Slack, and executes operational workflows autonomously.",
    icon: GearIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    glow: "group-hover:shadow-amber-500/15",
    accentBar: "bg-amber-500",
    capabilities: ["Task Management", "Slack Alerts", "Deployment Watch", "Runbooks"],
  },
  {
    type: "research" as const,
    name: "Research Agent",
    description:
      "Summarizes documents, gathers competitive intelligence, synthesizes reports, and prepares briefings on demand.",
    icon: MagnifyingGlassIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    glow: "group-hover:shadow-emerald-500/15",
    accentBar: "bg-emerald-500",
    capabilities: ["Web Research", "Doc Summaries", "Competitor Intel", "Reports"],
  },
]

function SandboxStateBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    STARTED: { label: "Running", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    STARTING: { label: "Starting", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    CREATING: { label: "Creating", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    STOPPING: { label: "Stopping", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    STOPPED: { label: "Stopped", cls: "bg-muted text-muted-foreground border-border/40" },
    ARCHIVING: { label: "Archiving", cls: "bg-muted text-muted-foreground border-border/40" },
    ARCHIVED: { label: "Archived", cls: "bg-muted text-muted-foreground border-border/40" },
    ERROR: { label: "Error", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  }
  const s = map[state] ?? { label: state, cls: "bg-muted text-muted-foreground border-border/40" }
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold h-5 px-1.5", s.cls)}>
      {s.label}
    </Badge>
  )
}

export default function AgentsPage() {
  const { setConfig } = useDashboardConfig()
  const { launchAgent } = useWorkspacePanel()
  const { proposals: pendingProposals, count: pendingCount } = usePendingApprovals()
  const { sessions, isLoading: sessionsLoading } = useAgentSessions({
    limit: 8,
    polling: true,
  })
  const {
    sandboxes,
    isLoading: sandboxLoading,
    error: sandboxError,
    daytonaConfigured,
    creating: creatingSandbox,
    activeCount: activeSandboxCount,
    createSandbox,
    sandboxAction,
  } = useSandboxes()

  const [newSandboxName, setNewSandboxName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    setConfig({
      title: "Agent Hub",
      description: "Launch and monitor your autonomous AI agents",
      breadcrumbs: [{ label: "Agent Hub" }],
    })
  }, [setConfig])

  const handleCreateSandbox = useCallback(async () => {
    const ok = await createSandbox(newSandboxName)
    if (ok) {
      setNewSandboxName("")
      setShowCreateForm(false)
    }
  }, [newSandboxName, createSandbox])

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-br from-primary/10 via-background to-violet-500/5 p-6 md:p-8">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 right-0 w-48 h-48 bg-violet-500/8 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 border border-primary/25 text-primary shrink-0">
              <RobotIcon className="size-6" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-lg font-bold text-foreground">Agent Hub</h1>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">Systems Online</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                Your autonomous workforce. Each agent securely accesses credentials from your Vault
                and augments your existing tools — without replacing them.
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 font-semibold"
              onClick={() => launchAgent("coding")}
            >
              <LightningIcon className="size-3.5" />
              Quick Prompt
            </Button>
            <Button
              size="sm"
              className="gap-2 font-semibold"
              onClick={() => launchAgent("coding")}
            >
              <PlusIcon className="size-3.5" />
              Launch Agent
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/20 pt-4">
          <LockSimpleIcon className="size-3.5 text-primary/60 shrink-0" />
          <span>
            Agents access credentials via{" "}
            <span className="text-foreground font-medium">server-side vault proxy</span> — raw keys
            are never exposed to the browser or agent runtime.
          </span>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <WarningCircleIcon className="size-4 text-amber-400 shrink-0 mt-0.5" weight="fill" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-400">
              {pendingCount} agent action{pendingCount !== 1 ? "s" : ""} awaiting your approval
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {pendingProposals
                .slice(0, 2)
                .map((p) => p.title)
                .join(" · ")}
              {pendingCount > 2 && ` · +${pendingCount - 2} more`}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="shrink-0 h-7 text-xs border-amber-500/25 text-amber-400 hover:bg-amber-500/10"
          >
            <Link href="/dashboard/proposals?status=awaiting_approval">Review</Link>
          </Button>
        </div>
      )}

      {/* Persona Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Available Agents</h2>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            4 agents ready
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {AGENT_PERSONAS.map((agent) => (
            <div
              key={agent.type}
              className={cn(
                "group relative flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-default overflow-hidden",
                "bg-card/50 backdrop-blur-sm hover:bg-card/80",
                agent.border,
                "hover:shadow-xl",
                agent.glow
              )}
            >
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left",
                  agent.accentBar
                )}
              />
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 relative z-10",
                  agent.bg,
                  agent.border,
                  agent.color
                )}
              >
                <agent.icon className="size-5" weight="duotone" />
              </div>
              <div className="space-y-1.5 relative z-10">
                <h3 className="font-bold text-sm text-foreground">{agent.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 relative z-10">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      agent.bg,
                      agent.border,
                      agent.color
                    )}
                  >
                    {cap}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30 relative z-10">
                <AgentStatusBadge status="idle" />
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 text-xs font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
                    agent.color
                  )}
                  onClick={() => launchAgent(agent.type)}
                >
                  Launch
                  <ArrowRightIcon className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daytona + Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/40 relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <CloudIcon className="size-4" />
                </div>
                <CardTitle className="text-sm">Daytona Sandboxes</CardTitle>
              </div>
              {daytonaConfigured === null || sandboxLoading ? (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-muted text-muted-foreground border-border/40"
                >
                  <SpinnerGapIcon className="size-3 animate-spin mr-1" />
                  Checking
                </Badge>
              ) : daytonaConfigured ? (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20"
                >
                  Not Configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Isolated cloud execution environments for your Coding Agent.
            </p>

            {daytonaConfigured === false && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                <WarningCircleIcon className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-400 font-medium">
                  Add your DAYTONA_API_KEY in Settings or .env to enable sandbox management.
                </p>
              </div>
            )}

            {sandboxError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2">
                <WarningCircleIcon className="size-3.5 text-red-400 shrink-0" />
                <p className="text-[11px] text-red-400 font-medium">{sandboxError}</p>
              </div>
            )}

            {daytonaConfigured && !sandboxLoading && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Active Sandboxes", desc: `${activeSandboxCount} running` },
                  { label: "Total Sandboxes", desc: `${sandboxes.length} provisioned` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border/30 bg-muted/20 p-2.5"
                  >
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {daytonaConfigured && sandboxes.length > 0 && (
              <div className="space-y-2">
                {sandboxes.map((sb) => (
                  <div
                    key={sb.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CloudIcon className="size-3.5 text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold truncate">{sb.name}</p>
                          <SandboxStateBadge state={sb.state} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {sb.cpu} CPU · {sb.memory} GB RAM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {sb.state === "STARTED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-amber-400"
                          onClick={() => sandboxAction(sb.id, "stop")}
                        >
                          Stop
                        </Button>
                      )}
                      {sb.state === "STOPPED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-emerald-400"
                          onClick={() => sandboxAction(sb.id, "start")}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] text-red-400"
                        onClick={() => sandboxAction(sb.id, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {daytonaConfigured && (
              <div>
                {showCreateForm ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSandboxName}
                      onChange={(e) => setNewSandboxName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateSandbox()
                        if (e.key === "Escape") setShowCreateForm(false)
                      }}
                      placeholder="Sandbox name..."
                      className="flex-1 h-8 rounded-md border border-border/40 bg-muted/20 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleCreateSandbox}
                      disabled={!newSandboxName.trim() || creatingSandbox}
                    >
                      {creatingSandbox ? (
                        <SpinnerGapIcon className="size-3 animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 text-xs"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <PlusIcon className="size-3.5" />
                    Create Sandbox
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Agent Activity</CardTitle>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">
                No agent sessions yet. Launch an agent to get started.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/30 -mx-1">
                {sessions.map((session) => (
                  <AgentSessionRow key={session.id} session={session} />
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground text-center">
                Full agent audit trail in{" "}
                <Link
                  href="/dashboard/audit-logs"
                  className="text-primary hover:underline font-medium"
                >
                  Audit Logs
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
