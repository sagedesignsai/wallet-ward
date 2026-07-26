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
  ClockIcon,
  CheckCircleIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
  PlusIcon,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useWorkspacePanel } from "@/context/workspace-panel"

// ─── Agent persona definitions ─────────────────────────────────────────────────

const AGENT_PERSONAS = [
  {
    type: "coding",
    name: "Coding Agent",
    description: "Builds, tests, and deploys applications inside isolated Daytona sandboxes. Pushes to GitHub, previews live.",
    icon: CodeIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    glow: "group-hover:shadow-blue-500/15",
    accentBar: "bg-blue-500",
    capabilities: ["Next.js / React", "Daytona Sandbox", "GitHub Push", "Live Preview"],
  },
  {
    type: "content",
    name: "Content Agent",
    description: "Drafts blogs, newsletters, social posts, and documentation using your brand context. Publishes to CMS.",
    icon: PencilSimpleIcon,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    glow: "group-hover:shadow-violet-500/15",
    accentBar: "bg-violet-500",
    capabilities: ["Blog Posts", "Newsletters", "Social Copy", "CMS Publish"],
  },
  {
    type: "ops",
    name: "Ops Agent",
    description: "Manages tasks, monitors deployments, sends team updates to Slack, and executes operational workflows autonomously.",
    icon: GearIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    glow: "group-hover:shadow-amber-500/15",
    accentBar: "bg-amber-500",
    capabilities: ["Task Management", "Slack Alerts", "Deployment Watch", "Runbooks"],
  },
  {
    type: "research",
    name: "Research Agent",
    description: "Summarizes documents, gathers competitive intelligence, synthesizes reports, and prepares briefings on demand.",
    icon: MagnifyingGlassIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    glow: "group-hover:shadow-emerald-500/15",
    accentBar: "bg-emerald-500",
    capabilities: ["Web Research", "Doc Summaries", "Competitor Intel", "Reports"],
  },
]

// ─── Mock recent agent runs ────────────────────────────────────────────────────
// TODO: Replace with real audit log data from /api/v1/audit-logs when available

const RECENT_RUNS = [
  {
    agent: "Coding Agent",
    action: "Scaffolded new Next.js landing page, pushed to GitHub",
    status: "completed",
    time: "2 hours ago",
    color: "text-blue-400",
  },
  {
    agent: "Ops Agent",
    action: "Sent weekly deployment summary to #engineering Slack channel",
    status: "completed",
    time: "5 hours ago",
    color: "text-amber-400",
  },
  {
    agent: "Content Agent",
    action: "Drafting Q3 product newsletter — awaiting your approval",
    status: "awaiting_approval",
    time: "1 day ago",
    color: "text-violet-400",
  },
  {
    agent: "Research Agent",
    action: "Compiled competitive analysis report for 5 competitors",
    status: "completed",
    time: "2 days ago",
    color: "text-emerald-400",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AGENT_COLOR_MAP: Record<string, string> = {
  coding: "text-blue-400",
  content: "text-violet-400",
  ops: "text-amber-400",
  research: "text-emerald-400",
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Sandbox types ─────────────────────────────────────────────────────────────

interface SandboxInfo {
  id: string
  name: string
  state: string
  cpu: number
  memory: number
  disk: number
  createdAt: string
  previewUrl?: string
}

// ─── Status helpers ────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === "completed")
    return <CheckCircleIcon className="size-4 text-emerald-400 shrink-0" />
  if (status === "running")
    return <SpinnerGapIcon className="size-4 text-blue-400 shrink-0 animate-spin" />
  if (status === "awaiting_approval")
    return <WarningCircleIcon className="size-4 text-amber-400 shrink-0" />
  return <ClockIcon className="size-4 text-muted-foreground shrink-0" />
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    running: { label: "Running", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    awaiting_approval: { label: "Awaiting Approval", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    failed: { label: "Failed", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    idle: { label: "Idle", cls: "bg-muted text-muted-foreground border-border/40" },
  }
  const s = map[status] ?? map.idle
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold h-5 px-1.5", s.cls)}>
      {s.label}
    </Badge>
  )
}

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { setConfig } = useDashboardConfig()
  const { launchAgent } = useWorkspacePanel()

  // Agent sessions state
  const [agentSessions, setAgentSessions] = useState<Array<{
    agent: string; action: string; status: string; time: string; color: string
  }>>([])

  // Sandbox state
  const [sandboxes, setSandboxes] = useState<SandboxInfo[]>([])
  const [sandboxLoading, setSandboxLoading] = useState(true)
  const [sandboxError, setSandboxError] = useState<string | null>(null)
  const [daytonaConfigured, setDaytonaConfigured] = useState<boolean | null>(null)
  const [creatingSandbox, setCreatingSandbox] = useState(false)
  const [newSandboxName, setNewSandboxName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    setConfig({
      title: "Agent Hub",
      description: "Launch and monitor your autonomous AI agents",
      breadcrumbs: [{ label: "Agent Hub" }],
    })
  }, [setConfig])

  // Fetch real agent sessions on mount
  useEffect(() => {
    fetch("/api/agents/sessions?limit=4")
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.length) {
          setAgentSessions(
            data.data.map((s: any) => ({
              agent: (s.type || "coding") + " agent",
              action: s.currentTask || s.name,
              status: s.status,
              time: timeAgo(s.createdAt),
              color: AGENT_COLOR_MAP[s.type] || "text-muted-foreground",
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  // Fetch sandboxes on mount
  const fetchSandboxes = useCallback(async () => {
    try {
      setSandboxLoading(true)
      setSandboxError(null)
      const res = await fetch("/api/agents/sandboxes")
      const data = await res.json()

      if (res.status === 503 && data.error?.code === "not_configured") {
        setDaytonaConfigured(false)
        setSandboxes([])
        return
      }

      if (!res.ok) {
        setSandboxError(data.error?.message ?? "Failed to load sandboxes")
        return
      }

      setDaytonaConfigured(true)
      setSandboxes(data.data ?? [])
    } catch (err) {
      setSandboxError(err instanceof Error ? err.message : "Failed to load sandboxes")
    } finally {
      setSandboxLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSandboxes()
  }, [fetchSandboxes])

  // Create sandbox
  const handleCreateSandbox = useCallback(async () => {
    if (!newSandboxName.trim()) return
    setCreatingSandbox(true)
    try {
      const res = await fetch("/api/agents/sandboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSandboxName.trim(), language: "javascript" }),
      })
      if (res.ok) {
        setNewSandboxName("")
        setShowCreateForm(false)
        await fetchSandboxes()
      } else {
        const data = await res.json()
        setSandboxError(data.error?.message ?? "Failed to create sandbox")
      }
    } catch (err) {
      setSandboxError(err instanceof Error ? err.message : "Failed to create sandbox")
    } finally {
      setCreatingSandbox(false)
    }
  }, [newSandboxName, fetchSandboxes])

  // Sandbox actions (stop / start / delete)
  const handleSandboxAction = useCallback(
    async (sandboxId: string, action: "stop" | "start" | "delete") => {
      try {
        const res = await fetch(`/api/agents/sandboxes/${sandboxId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        if (res.ok) {
          await fetchSandboxes()
        } else {
          const data = await res.json()
          setSandboxError(data.error?.message ?? `Failed to ${action} sandbox`)
        }
      } catch (err) {
        setSandboxError(err instanceof Error ? err.message : `Failed to ${action} sandbox`)
      }
    },
    [fetchSandboxes],
  )

  const activeSandboxCount = sandboxes.filter(
    (s) => s.state === "STARTED" || s.state === "STARTING",
  ).length

  return (
    <div className="flex flex-col gap-8">

      {/* ── Hero Banner ────────────────────────────────────────────────────────── */}
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
                Your autonomous workforce. Each agent securely accesses credentials from your Vault and augments your existing tools — without replacing them.
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" className="gap-2 font-semibold" onClick={() => launchAgent("coding")}>
              <LightningIcon className="size-3.5" />
              Quick Prompt
            </Button>
            <Button size="sm" className="gap-2 font-semibold" onClick={() => launchAgent("coding")}>
              <PlusIcon className="size-3.5" />
              Launch Agent
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/20 pt-4">
          <LockSimpleIcon className="size-3.5 text-primary/60 shrink-0" />
          <span>
            Agents access credentials via{" "}
            <span className="text-foreground font-medium">server-side vault proxy</span>
            {" "}— raw keys are never exposed to the browser or agent runtime.
          </span>
        </div>
      </div>

      {/* ── Agent Persona Cards ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Available Agents</h2>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">4 agents ready</Badge>
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
                agent.glow,
              )}
            >
              {/* Accent top bar */}
              <div className={cn("absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left", agent.accentBar)} />

              {/* Corner glow */}
              <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden rounded-2xl pointer-events-none">
                <div className={cn("absolute top-3 right-3 w-12 h-12 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl", agent.bg)} />
              </div>

              {/* Icon */}
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 relative z-10", agent.bg, agent.border, agent.color)}>
                <agent.icon className="size-5" weight="duotone" />
              </div>

              {/* Name & Description */}
              <div className="space-y-1.5 relative z-10">
                <h3 className="font-bold text-sm text-foreground">{agent.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 relative z-10">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", agent.bg, agent.border, agent.color)}
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {/* Status + Launch */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30 relative z-10">
                <StatusBadge status="idle" />
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("h-7 text-xs font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity", agent.color)}
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

      {/* ── Daytona + Activity ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Daytona Sandbox Card */}
        <Card className="border-border/40 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <CloudIcon className="size-4" />
                </div>
                <CardTitle className="text-sm">Daytona Sandboxes</CardTitle>
              </div>

              {/* Connection status */}
              {daytonaConfigured === null || sandboxLoading ? (
                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border/40">
                  <SpinnerGapIcon className="size-3 animate-spin mr-1" />
                  Checking
                </Badge>
              ) : daytonaConfigured ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    Connected
                  </Badge>
                </div>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Not Configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Isolated cloud execution environments for your Coding Agent. Each sandbox runs your code safely, streams live terminal output, and exposes a live web preview — all inside Flowspace.
            </p>

            {/* Not-configured notice */}
            {daytonaConfigured === false && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                <WarningCircleIcon className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-400 font-medium">
                  Add your DAYTONA_API_KEY in Settings or .env to enable sandbox management.
                </p>
              </div>
            )}

            {/* Error notice */}
            {sandboxError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2">
                <WarningCircleIcon className="size-3.5 text-red-400 shrink-0" />
                <p className="text-[11px] text-red-400 font-medium">{sandboxError}</p>
              </div>
            )}

            {/* Sandbox stats when configured */}
            {daytonaConfigured && !sandboxLoading && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Active Sandboxes", desc: `${activeSandboxCount} running` },
                  { label: "Total Sandboxes", desc: `${sandboxes.length} provisioned` },
                  { label: "Live Preview", desc: "Web server in-app iframe" },
                  { label: "Auto Teardown", desc: "No lingering resources" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Feature grid when not configured */}
            {!daytonaConfigured && !sandboxLoading && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Isolated Execution", desc: "Air-gapped from production" },
                  { label: "Live Preview", desc: "Web server in-app iframe" },
                  { label: "Terminal Streaming", desc: "Real-time output" },
                  { label: "Auto Teardown", desc: "No lingering resources" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Loading skeleton */}
            {sandboxLoading && (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-lg border border-border/30 bg-muted/20 p-2.5 animate-pulse">
                    <div className="h-3 bg-muted rounded w-20 mb-1.5" />
                    <div className="h-2 bg-muted rounded w-16" />
                  </div>
                ))}
              </div>
            )}

            {/* Sandbox list */}
            {daytonaConfigured && sandboxes.length > 0 && (
              <div className="space-y-2">
                {sandboxes.map((sb) => (
                  <div
                    key={sb.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-7 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                        <CloudIcon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{sb.name}</p>
                          <SandboxStateBadge state={sb.state} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {sb.cpu} CPU &middot; {sb.memory} GB RAM &middot; {sb.disk} GB Disk
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {sb.previewUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] font-semibold text-cyan-400 gap-1"
                          asChild
                        >
                          <a href={sb.previewUrl} target="_blank" rel="noopener noreferrer">
                            Preview
                          </a>
                        </Button>
                      )}
                      {sb.state === "STARTED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] font-semibold text-amber-400"
                          onClick={() => handleSandboxAction(sb.id, "stop")}
                        >
                          Stop
                        </Button>
                      )}
                      {sb.state === "STOPPED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] font-semibold text-emerald-400"
                          onClick={() => handleSandboxAction(sb.id, "start")}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] font-semibold text-red-400"
                        onClick={() => handleSandboxAction(sb.id, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state when configured but no sandboxes */}
            {daytonaConfigured && !sandboxLoading && sandboxes.length === 0 && (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border/30 bg-muted/10 px-3 py-6">
                <p className="text-xs text-muted-foreground text-center">
                  No sandboxes yet. Create one to get started.
                </p>
              </div>
            )}

            {/* Create sandbox button / form */}
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
                      className="flex-1 h-8 rounded-md border border-border/40 bg-muted/20 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1"
                      onClick={handleCreateSandbox}
                      disabled={!newSandboxName.trim() || creatingSandbox}
                    >
                      {creatingSandbox ? (
                        <SpinnerGapIcon className="size-3 animate-spin" />
                      ) : (
                        <PlusIcon className="size-3" />
                      )}
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewSandboxName("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 font-semibold text-xs"
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

        {/* Recent Agent Activity */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Agent Activity</CardTitle>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border/30">
              {(agentSessions.length > 0 ? agentSessions : RECENT_RUNS).map((run, i) => (
                <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <StatusIcon status={run.status} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wide", run.color)}>
                        {run.agent}
                      </span>
                      <StatusBadge status={run.status} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{run.action}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">{run.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground text-center">
                Full agent audit trail in{" "}
                <Link href="/dashboard/audit-logs" className="text-primary hover:underline font-medium">
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
