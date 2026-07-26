"use client"

import Link from "next/link"
import {
  CloudIcon,
  TrashIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react"
import { AgentAvatar } from "@/components/agents/agent-avatar"
import { AgentStatusBadge } from "@/components/agents/agent-session-row"
import { Button } from "@/components/ui/button"
import { TimeAgo } from "@/components/dashboard/time-ago"
import type { AgentSessionDto } from "@/hooks/use-agent-sessions"

export function SessionHeader({
  session,
  onDelete,
  deleting,
}: {
  session: AgentSessionDto
  onDelete?: () => void
  deleting?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <AgentAvatar
          type={session.type}
          status={session.status}
          size="lg"
        />
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-foreground truncate">
              {session.name}
            </h1>
            <AgentStatusBadge status={session.status} />
          </div>
          <p className="text-xs text-muted-foreground capitalize">
            {session.type} agent
            {" · "}
            Created <TimeAgo date={session.createdAt} />
          </p>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <Link
              href={`/dashboard/projects/${session.projectId}`}
              className="text-xs text-primary hover:underline"
            >
              View project
            </Link>
            {session.sandboxUrl && (
              <a
                href={session.sandboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
              >
                <ArrowSquareOutIcon className="size-3" />
                Live preview
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {session.daytonaSandboxId && (
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
            <Link href={`/dashboard/agents/${session.id}#sandbox`}>
              <CloudIcon className="size-3.5" />
              Sandbox
            </Link>
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-red-400 hover:text-red-300"
            onClick={onDelete}
            disabled={deleting}
          >
            <TrashIcon className="size-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
