"use client"

import {
  CloudIcon,
  WarningCircleIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AgentSessionDto } from "@/hooks/use-agent-sessions"
import { useSandboxes } from "@/hooks/use-sandboxes"

function SandboxStateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    started: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    starting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    stopped: "bg-muted text-muted-foreground border-border/40",
    stopping: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    destroyed: "bg-red-500/10 text-red-400 border-red-500/20",
    paused: "bg-muted text-muted-foreground border-border/40",
  }
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] h-5", map[state] ?? "bg-muted text-muted-foreground")}
    >
      {state}
    </Badge>
  )
}

export function SessionSandboxPanel({ session }: { session: AgentSessionDto }) {
  const { sandboxes, daytonaConfigured, isLoading, sandboxAction } = useSandboxes()

  if (session.type !== "coding") return null

  const bound = session.daytonaSandboxId
    ? sandboxes.find((s) => s.id === session.daytonaSandboxId)
    : null

  return (
    <Card className="border-border/40" id="sandbox">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <CloudIcon className="size-3.5" />
          </div>
          <CardTitle className="text-sm">Daytona Sandbox</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {daytonaConfigured === false && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
            <WarningCircleIcon className="size-3.5 text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400">
              Daytona is not configured. Add DAYTONA_API_KEY to enable sandboxes.
            </p>
          </div>
        )}

        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading sandbox…</p>
        )}

        {!isLoading && daytonaConfigured && !session.daytonaSandboxId && (
          <p className="text-xs text-muted-foreground italic">
            No sandbox bound to this session yet.
          </p>
        )}

        {session.daytonaSandboxId && (
          <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">
                  {bound?.name ?? session.daytonaSandboxId}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {session.daytonaSandboxId}
                </p>
              </div>
              {bound && <SandboxStateBadge state={bound.state} />}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(session.sandboxUrl || bound?.previewUrl) && (
                <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" asChild>
                  <a
                    href={session.sandboxUrl ?? bound?.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowSquareOutIcon className="size-3" />
                    Preview
                  </a>
                </Button>
              )}
              {bound?.state === "started" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] text-amber-400"
                  onClick={() => sandboxAction(bound.id, "stop")}
                >
                  Stop
                </Button>
              )}
              {bound?.state === "stopped" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] text-emerald-400"
                  onClick={() => sandboxAction(bound.id, "start")}
                >
                  Start
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
