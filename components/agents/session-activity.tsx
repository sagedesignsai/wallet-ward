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
          <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Current task
          </p>
          <p className="text-sm text-foreground">
            {session.currentTask || (
              <span className="text-muted-foreground italic">
                No active task
              </span>
            )}
          </p>
        </div>

        {session.prompt && (
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Prompt
            </p>
            <p className="max-h-48 overflow-y-auto rounded-lg border border-border/30 bg-muted/20 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {session.prompt}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
            <p className="text-[10px] text-muted-foreground">Created</p>
            <p className="mt-0.5 text-xs font-medium">
              <TimeAgo date={session.createdAt} />
            </p>
          </div>
          <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5">
            <p className="text-[10px] text-muted-foreground">Updated</p>
            <p className="mt-0.5 text-xs font-medium">
              <TimeAgo date={session.updatedAt} />
            </p>
          </div>
        </div>

        {session.metadata && Object.keys(session.metadata).length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Metadata
            </p>
            <pre className="max-h-40 overflow-x-auto rounded-lg border border-border/30 bg-muted/20 p-3 text-[11px] text-muted-foreground">
              {JSON.stringify(session.metadata, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
