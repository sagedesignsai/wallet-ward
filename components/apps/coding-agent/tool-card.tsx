"use client"

import { useState } from "react"
import type { OpencodePart } from "@/lib/opencode/client"
import { cn } from "@/lib/utils"
import {
  CaretDownIcon,
  CheckCircleIcon,
  CircleIcon,
  CircleNotchIcon,
  XCircleIcon,
} from "@phosphor-icons/react"

type ToolPart = Extract<OpencodePart, { type: "tool" }>

const BORDER_BY_STATUS: Record<string, string> = {
  pending: "border-slate-800",
  running: "border-blue-500/25",
  completed: "border-emerald-500/20",
  error: "border-rose-500/30",
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <CircleNotchIcon size={13} className="animate-spin text-blue-400" />
    case "completed":
      return <CheckCircleIcon size={13} weight="fill" className="text-emerald-400" />
    case "error":
      return <XCircleIcon size={13} weight="fill" className="text-rose-400" />
    default:
      return <CircleIcon size={13} className="text-slate-600" />
  }
}

export function ToolCard({ part }: { part: ToolPart }) {
  const { tool, title, state } = part
  const hasBody = Boolean(state.output) || Boolean(state.error)
  // Error output is important — surface it expanded by default.
  const [open, setOpen] = useState(state.status === "error")

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-slate-900/60",
        BORDER_BY_STATUS[state.status] ?? "border-slate-800"
      )}
    >
      <button
        type="button"
        onClick={() => hasBody && setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-slate-900/80"
      >
        <StatusIcon status={state.status} />
        <span className="font-mono text-[11px] text-slate-300">{tool}</span>
        {title && <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">{title}</span>}
        {!title && <span className="flex-1" />}
        <span className="text-[10px] capitalize text-slate-600">{state.status}</span>
        {hasBody && (
          <CaretDownIcon
            size={12}
            className={cn("text-slate-500 transition-transform", open && "rotate-180")}
          />
        )}
      </button>
      {open && hasBody && (
        <div className="border-t border-slate-800/60 bg-slate-950/70 px-2.5 py-2">
          <pre
            className={cn(
              "max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed",
              state.error ? "text-rose-400" : "text-slate-400"
            )}
          >
            {state.error ?? state.output}
          </pre>
        </div>
      )}
    </div>
  )
}
