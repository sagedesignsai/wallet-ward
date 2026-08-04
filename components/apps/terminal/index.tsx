"use client"

import { useEffect, useRef } from "react"
import type { AppProps } from "@/types/desktop/app"

export interface TerminalContent {
  lines: string[]
  title?: string
  cwd?: string
}

export function TerminalApp({ content, windowId }: AppProps) {
  const raw = content as TerminalContent | undefined
  const terminalContent = {
    lines: raw?.lines ?? ([] as string[]),
    title: raw?.title,
    cwd: raw?.cwd,
  }
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when lines change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [terminalContent.lines.length])

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Toolbar */}
      {terminalContent.cwd && (
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/50 px-4 py-1.5">
          <span className="font-mono text-[10px] text-zinc-500">{terminalContent.cwd}</span>
        </div>
      )}

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-xs leading-5 text-zinc-300"
      >
        {terminalContent.lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        ))}
        <div className="mt-2 flex items-center gap-1 text-green-500">
          <span>$</span>
          <span className="animate-pulse">▊</span>
        </div>
      </div>
    </div>
  )
}
