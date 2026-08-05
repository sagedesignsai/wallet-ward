"use client"

import { use, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import { WarningIcon, RobotIcon } from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useAgentSession } from "@/hooks/use-agent-session"
import { SessionHeader } from "@/components/agents/session-header"
import { SessionActivity } from "@/components/agents/session-activity"
import { SessionProposals } from "@/components/agents/session-proposals"
import { SessionSandboxPanel } from "@/components/agents/session-sandbox-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

export default function AgentSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  return <AgentSessionInner sessionId={sessionId} />
}

function AgentSessionInner({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const { session, pendingProposals, isLoading, error, deleteSession } =
    useAgentSession(sessionId)
  const [deleting, setDeleting] = useState(false)

  if (session) {
    useDashboardConfigStore.setState({
      title: session.name,
      description: `${session.type} agent session`,
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sessions", href: "/dashboard/sessions" },
        { label: session.name },
      ],
    })
  }

  const handleDelete = async () => {
    if (!confirm("Delete this agent session?")) return
    setDeleting(true)
    const ok = await deleteSession()
    setDeleting(false)
    if (ok) router.push("/dashboard/sessions")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {error ? (
              <WarningIcon className="size-4" />
            ) : (
              <RobotIcon className="size-4" />
            )}
          </EmptyMedia>
          <EmptyTitle>Session not found</EmptyTitle>
          <EmptyDescription>
            {error ?? "This agent session may have been deleted."}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href="/dashboard/sessions">Back to Sessions</Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SessionHeader
        session={session}
        onDelete={handleDelete}
        deleting={deleting}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SessionActivity session={session} />
          <SessionSandboxPanel session={session} />
        </div>
        <SessionProposals pendingProposals={pendingProposals} />
      </div>
    </div>
  )
}
