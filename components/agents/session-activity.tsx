"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import type { AgentSessionDto } from "@/hooks/use-agent-sessions"

export function SessionActivity({ session }: { session: AgentSessionDto }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Current task
          </p>
          <p className="text-sm text-foreground">
            {session.currentTask || (
              <span className="text-muted-foreground italic">No active task</span>
            )}
          </p>
        </div>

        {session.prompt && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Prompt
            </p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap rounded-lg border border-border/30 bg-muted/20 p-3 max-h-48 overflow-y-auto">
              {session.prompt}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
            <p className="text-[10px] text-muted-foreground">Created</p>
            <p className="text-xs font-medium mt-0.5">
              <TimeAgo date={session.createdAt} />
            </p>
          </div>
          <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
            <p className="text-[10px] text-muted-foreground">Updated</p>
            <p className="text-xs font-medium mt-0.5">
              <TimeAgo date={session.updatedAt} />
            </p>
          </div>
        </div>

        {session.metadata && Object.keys(session.metadata).length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Metadata
            </p>
            <pre className="text-[11px] text-muted-foreground rounded-lg border border-border/30 bg-muted/20 p-3 overflow-x-auto max-h-40">
              {JSON.stringify(session.metadata, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
