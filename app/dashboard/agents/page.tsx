"use client"

import { useAgentSessions, type AgentSessionDto } from "@/hooks/use-agent-sessions"
import { usePendingApprovals } from "@/hooks/use-pending-approvals"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ApprovalCard } from "@/components/proposals/approval-card"
import { AgentSessionRow } from "@/components/agents/agent-session-row"
import {
  RocketLaunchIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  PlusIcon,
  CodeIcon,
  PencilSimpleIcon,
  GearIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

// ─── Agent Type Config ────────────────────────────────────────────────────────

const AGENT_TYPES = [
  {
    id: "coding",
    label: "Coding Agent",
    icon: CodeIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    description: "Build, test, and deploy applications",
  },
  {
    id: "content",
    label: "Content Agent",
    icon: PencilSimpleIcon,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    description: "Draft documents and content",
  },
  {
    id: "ops",
    label: "Ops Agent",
    icon: GearIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    description: "Manage operations and deployments",
  },
  {
    id: "research",
    label: "Research Agent",
    icon: MagnifyingGlassIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    description: "Research and analyze information",
  },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  isLoading,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
          </div>
          <div className={cn("rounded-lg p-3", bg)}>
            <Icon className={cn("size-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Launch Agent Button ──────────────────────────────────────────────────────

function LaunchAgentButton() {
  const [isLaunching, setIsLaunching] = useState(false)
  const router = useRouter()

  const handleLaunch = async (agentType: string) => {
    setIsLaunching(true)
    try {
      // TODO: Implement agent launch API
      toast.success(`Launching ${agentType} agent...`)
      // Redirect to workspace with new session
      router.push(`/dashboard?agent=${agentType}`)
    } catch (error) {
      toast.error("Failed to launch agent")
      console.error(error)
    } finally {
      setIsLaunching(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLaunching}>
          <RocketLaunchIcon className="mr-2 size-4" />
          Launch Agent
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {AGENT_TYPES.map((agent) => {
          const Icon = agent.icon
          return (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => handleLaunch(agent.id)}
              className="flex flex-col items-start gap-1 py-3"
            >
              <div className="flex w-full items-center gap-2">
                <div className={cn("rounded p-1.5", agent.bg)}>
                  <Icon className={cn("size-3.5", agent.color)} />
                </div>
                <span className="text-sm font-medium">{agent.label}</span>
              </div>
              <p className="pl-8 text-xs text-muted-foreground">
                {agent.description}
              </p>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { setConfig } = useDashboardConfig()
  const { sessions, isLoading: sessionsLoading } = useAgentSessions()
  const {
    proposals,
    count: proposalCount,
    isLoading: proposalsLoading,
    refresh: refreshProposals,
  } = usePendingApprovals()

  const activeSessions = sessions?.filter((s: { status: string }) => s.status === "active") ?? []
  const completedToday =
    sessions?.filter((s: { status: string; updatedAt: string | Date }) => {
      if (s.status !== "completed") return false
      const today = new Date()
      const sessionDate = new Date(s.updatedAt)
      return sessionDate.toDateString() === today.toDateString()
    }) ?? []

  const handleApprove = async (proposalId: string, notes?: string) => {
    try {
      const proposal = proposals.find((p) => p.id === proposalId)
      if (!proposal) return

      const res = await fetch(
        `/api/v1/projects/${proposal.projectId}/proposals/${proposalId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      )
      if (!res.ok) throw new Error("Failed to approve")
      toast.success("Proposal approved")
      refreshProposals()
    } catch (error) {
      toast.error("Failed to approve proposal")
      console.error(error)
    }
  }

  const handleReject = async (proposalId: string, notes?: string) => {
    try {
      const proposal = proposals.find((p) => p.id === proposalId)
      if (!proposal) return

      const res = await fetch(
        `/api/v1/projects/${proposal.projectId}/proposals/${proposalId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      )
      if (!res.ok) throw new Error("Failed to reject")
      toast.success("Proposal rejected")
      refreshProposals()
    } catch (error) {
      toast.error("Failed to reject proposal")
      console.error(error)
    }
  }

  useEffect(() => {
    setConfig({
      title: "Agent Hub",
      description: "Manage your autonomous AI agents and their operations",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Agent Hub" },
      ],
      actions: <LaunchAgentButton />,
    })
  }, [setConfig])

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active Agents"
          value={activeSessions.length}
          icon={RocketLaunchIcon}
          color="text-green-400"
          bg="bg-green-500/10"
          isLoading={sessionsLoading}
        />
        <StatCard
          title="Pending Approvals"
          value={proposalCount}
          icon={ClockIcon}
          color="text-amber-400"
          bg="bg-amber-500/10"
          isLoading={proposalsLoading}
        />
        <StatCard
          title="Completed Today"
          value={completedToday.length}
          icon={CheckCircleIcon}
          color="text-blue-400"
          bg="bg-blue-500/10"
          isLoading={sessionsLoading}
        />
      </div>

      {/* Pending Approvals Section */}
      {proposalCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <WarningCircleIcon
                  className="size-5 text-amber-400"
                  weight="fill"
                />
                Pending Approvals
                <Badge variant="secondary" className="ml-2">
                  {proposalCount}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposalsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <>
                {proposals.slice(0, 5).map((proposal) => (
                  <ApprovalCard
                    key={proposal.id}
                    proposal={proposal}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
                {proposalCount > 5 && (
                  <div className="pt-2 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/dashboard/proposals">
                        View all {proposalCount} proposals
                      </a>
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Agent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="size-2 animate-pulse rounded-full bg-green-500" />
            Active Agent Sessions
            {activeSessions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeSessions.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="py-8 text-center">
              <RocketLaunchIcon className="mx-auto mb-3 size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No active agents running
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Launch an agent to get started
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

      {/* Recent Completions */}
      {completedToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="size-5 text-blue-400" />
              Completed Today
              <Badge variant="secondary" className="ml-2">
                {completedToday.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedToday.slice(0, 5).map((session: AgentSessionDto) => (
                <AgentSessionRow key={session.id} session={session} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
