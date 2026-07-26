"use client"

import Link from "next/link"
import { WarningCircleIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SessionPendingProposals } from "@/hooks/use-agent-session"

export function SessionProposals({
  pendingProposals,
}: {
  pendingProposals: SessionPendingProposals | null
}) {
  if (!pendingProposals) {
    return (
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Related Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">No proposals linked.</p>
        </CardContent>
      </Card>
    )
  }

  const awaiting = pendingProposals.awaiting ?? []
  const others = [
    ...(pendingProposals.approved ?? []),
    ...(pendingProposals.executed ?? []),
    ...(pendingProposals.rejected ?? []),
    ...(pendingProposals.failed ?? []),
  ]

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Related Proposals</CardTitle>
          {awaiting.length > 0 && (
            <Badge
              variant="outline"
              className="h-5 text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/25"
            >
              {awaiting.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {awaiting.length === 0 && others.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No proposals yet.</p>
        )}

        {awaiting.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/proposals/${p.id}`}
            className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 hover:bg-amber-500/10 transition-colors"
          >
            <WarningCircleIcon className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{p.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {p.actionType}
                {p.targetSystem ? ` · ${p.targetSystem}` : ""}
              </p>
            </div>
          </Link>
        ))}

        {others.slice(0, 5).map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/proposals/${p.id}`}
            className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors"
          >
            <CheckCircleIcon className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{p.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                {p.status.replace(/_/g, " ")} · {p.actionType}
              </p>
            </div>
          </Link>
        ))}

        {(awaiting.length > 0 || others.length > 0) && (
          <Button variant="ghost" size="sm" asChild className="w-full h-8 text-xs mt-1">
            <Link href="/dashboard/proposals">View all proposals</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
