"use client"

import { useState, useCallback } from "react"
import {
  MonitorIcon,
  DeviceMobileIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { useSessions } from "@/hooks/use-sessions"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyMedia, EmptyDescription } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

function parseUserAgent(ua: string | null): {
  browser: string
  os: string
  isMobile: boolean
} {
  if (!ua) return { browser: "Unknown", os: "Unknown", isMobile: false }

  let browser = "Unknown Browser"
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome"
  else if (/Edg/i.test(ua)) browser = "Edge"
  else if (/Firefox/i.test(ua)) browser = "Firefox"
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari"
  else if (/Opera|OPR/i.test(ua)) browser = "Opera"

  let os = "Unknown OS"
  if (/Windows/i.test(ua)) os = "Windows"
  else if (/Mac OS/i.test(ua)) os = "macOS"
  else if (/Linux/i.test(ua)) os = "Linux"
  else if (/Android/i.test(ua)) os = "Android"
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS"

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)

  return { browser, os, isMobile }
}

export function SessionsList({
  currentSessionId,
}: {
  currentSessionId: string
}) {
  const {
    sessions,
    isLoading,
    revokeSession,
    revokeAllOther,
  } = useSessions(currentSessionId)

  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleRevoke = useCallback(
    async (sessionId: string) => {
      setRevokingId(sessionId)
      const ok = await revokeSession(sessionId)
      setRevokingId(null)

      if (ok) {
        toast.success("Session revoked")
      } else {
        toast.error("Failed to revoke session")
      }
    },
    [revokeSession]
  )

  const handleRevokeAll = useCallback(async () => {
    const ok = await revokeAllOther()
    if (ok) {
      toast.success("All other sessions revoked")
    } else {
      toast.error("Failed to revoke sessions")
    }
  }, [revokeAllOther])

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId)

  return (
    <Card className="gap-0">
      <CardHeader className="border-b border-border/40 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Active Sessions</CardTitle>
            <CardDescription>
              Devices and browsers signed into your account
            </CardDescription>
          </div>
          {!isLoading && otherSessions.length > 0 && (
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="sm">
                  <WarningIcon className="size-3" />
                  Revoke All Others
                </Button>
              }
              title="Revoke all other sessions?"
              description="This will sign you out of all other devices and browsers. You'll need to sign in again on those devices."
              confirmLabel="Revoke All"
              variant="destructive"
              onConfirm={handleRevokeAll}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/40 p-3"
              >
                <Skeleton className="size-8 rounded-md shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <DeviceMobileIcon className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No active sessions</EmptyTitle>
              <EmptyDescription>
                No session data available
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => {
              const { browser, os, isMobile } = parseUserAgent(
                session.userAgent
              )
              const isCurrent = session.id === currentSessionId

              return (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    isCurrent
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/40 hover:border-border/60"
                  )}
                >
                  {/* Device icon */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isMobile ? (
                      <DeviceMobileIcon className="size-4" />
                    ) : (
                      <MonitorIcon className="size-4" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {browser} on {os}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="default"
                          className="px-1.5 py-0 text-[0.6rem] shrink-0"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {session.ipAddress && (
                        <span className="text-[0.65rem] text-muted-foreground tabular-nums">
                          {session.ipAddress}
                        </span>
                      )}
                      {session.ipAddress && (
                        <span className="text-muted-foreground/30">·</span>
                      )}
                      <span className="text-[0.65rem] text-muted-foreground">
                        Signed in <TimeAgo date={session.createdAt} />
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={revokingId === session.id}
                      onClick={() => handleRevoke(session.id)}
                    >
                      {revokingId === session.id ? (
                        <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        "Revoke"
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
