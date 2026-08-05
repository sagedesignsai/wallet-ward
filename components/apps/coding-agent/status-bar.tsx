"use client"

import type { OpencodeSessionStatus } from "@/hooks/use-opencode-session"
import { cn } from "@/lib/utils"
import { StopIcon } from "@phosphor-icons/react"

interface StatusBarProps {
  status: OpencodeSessionStatus
  hasSession: boolean
  currentTool?: string | null
  sandboxId?: string
  onAbort?: () => void
}

const STATUS_META: Record<OpencodeSessionStatus, { label: string; dot: string; pulse?: boolean }> = {
  connecting: { label: "Connecting", dot: "bg-amber-400", pulse: true },
  ready: { label: "Ready", dot: "bg-emerald-400" },
  busy: { label: "Busy", dot: "bg-blue-400", pulse: true },
  idle: { label: "Idle", dot: "bg-emerald-400" },
  error: { label: "Error", dot: "bg-rose-500" },
}

export function StatusBar({ status, hasSession, currentTool, sandboxId, onAbort }: StatusBarProps) {
  const meta = hasSession ? STATUS_META[status] : null

  return (
    <div className="flex h-7 shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-950 px-3">
      {meta ? (
        <>
          <span className="relative flex size-1.5">
            {meta.pulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  meta.dot
                )}
              />
            )}
            <span className={cn("relative inline-flex size-1.5 rounded-full", meta.dot)} />
          </span>
          <span className="text-[11px] text-slate-400">{meta.label}</span>
        </>
      ) : (
        <>
          <span className="size-1.5 rounded-full bg-slate-600" />
          <span className="text-[11px] text-slate-500">No session</span>
        </>
      )}

      {currentTool && (
        <>
          <span className="text-slate-700">/</span>
          <span className="truncate font-mono text-[10px] text-slate-500">{currentTool}</span>
        </>
      )}

      <span className="flex-1" />

      {sandboxId && (
        <span className="hidden font-mono text-[10px] text-slate-600 sm:inline" title={sandboxId}>
          {sandboxId.slice(0, 12)}…
        </span>
      )}

      {status === "busy" && hasSession && (
        <button
          type="button"
          onClick={onAbort}
          className="flex h-5 shrink-0 items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-1.5 text-[10px] font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
        >
          <StopIcon size={10} weight="fill" />
          Abort
        </button>
      )}
    </div>
  )
}
