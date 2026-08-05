"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RefObject } from "react"
import type { OpencodeSessionStatus } from "@/hooks/use-opencode-session"
import type { OpencodePart } from "@/lib/opencode/client"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { cn } from "@/lib/utils"
import {
  CaretDownIcon,
  CaretRightIcon,
  ChatCircleTextIcon,
  CircleNotchIcon,
  DotsThreeIcon,
  PaperPlaneTiltIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { ToolCard } from "./tool-card"

interface TranscriptMessage {
  info: { id: string; role?: string }
  parts: Record<string, OpencodePart>
}

interface AgentTranscriptProps {
  messages: TranscriptMessage[]
  status: OpencodeSessionStatus
  lastError: string | null
  disabled?: boolean
  placeholder?: string
  onSend: (text: string) => void | Promise<void>
}

interface FlatItem {
  key: string
  part: OpencodePart
  isUser: boolean
  isLast: boolean
}

export function AgentTranscript({
  messages,
  status,
  lastError,
  disabled,
  placeholder,
  onSend,
}: AgentTranscriptProps) {
  // Parts keyed by id — insertion order is stream order, so Object.values is safe.
  const items = useMemo<FlatItem[]>(() => {
    const flat: FlatItem[] = []
    for (const message of messages) {
      const isUser = message.info.role === "user" || message.info.id.startsWith("user-")
      for (const part of Object.values(message.parts)) {
        flat.push({ key: `${message.info.id}:${part.id}`, part, isUser, isLast: false })
      }
    }
    if (flat.length > 0) flat[flat.length - 1].isLast = true
    return flat
  }, [messages])

  const viewportRef = useRef<HTMLDivElement | null>(null)

  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-slate-950">
        <ErrorBanner error={lastError} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          {status === "connecting" ? (
            <>
              <CircleNotchIcon size={28} className="animate-spin text-blue-400" />
              <p className="text-sm text-slate-400">Connecting to agent server…</p>
            </>
          ) : status === "error" ? (
            <>
              <div className="flex size-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                <WarningCircleIcon size={20} />
              </div>
              <p className="text-sm text-rose-300">Connection lost</p>
              <p className="max-w-sm text-xs text-slate-600">
                The agent server stopped responding. The status bar shows the last error — abort
                and start a new session if it does not recover.
              </p>
            </>
          ) : (
            <>
              <div className="flex size-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500">
                <ChatCircleTextIcon size={20} />
              </div>
              <p className="text-sm text-slate-400">Agent is ready</p>
              <p className="max-w-sm text-xs text-slate-600">
                Send a prompt to start a conversation. The transcript streams here as the agent
                works.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950">
      <ErrorBanner error={lastError} />
      <MessageScrollerProvider defaultScrollPosition="end">
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport ref={viewportRef}>
            <MessageScrollerContent className="gap-2 px-4 py-3">
              {items.map((item) => (
                <MessageScrollerItem key={item.key} messageId={item.key} scrollAnchor={item.isLast}>
                  <PartView item={item} status={status} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" />
        </MessageScroller>
      </MessageScrollerProvider>
      <AutoScrollPinner viewportRef={viewportRef} items={items} />
      <PromptBar disabled={disabled} placeholder={placeholder} onSend={onSend} />
    </div>
  )
}

function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div className="flex shrink-0 items-start gap-2 border-b border-rose-500/20 bg-rose-500/10 px-3 py-2">
      <WarningCircleIcon size={13} className="mt-px shrink-0 text-rose-400" />
      <span className="text-[11px] leading-relaxed text-rose-300">{error}</span>
    </div>
  )
}

/**
 * Keeps the transcript pinned to the latest part while the user is at the
 * bottom, without fighting manual scrolling. Streamed text deltas update
 * existing items, so we watch the whole item list, not just its length.
 */
function AutoScrollPinner({
  viewportRef,
  items,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  items: unknown[]
}) {
  const stickToBottom = useRef(true)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onScroll = () => {
      stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [viewportRef])

  useEffect(() => {
    const el = viewportRef.current
    if (items.length > 0 && el && stickToBottom.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [items, viewportRef])

  return null
}

function PartView({ item, status }: { item: FlatItem; status: OpencodeSessionStatus }) {
  const { part, isUser, isLast } = item
  switch (part.type) {
    case "text":
      if (isUser) {
        return (
          <div className="flex justify-end">
            <div className="max-w-[85%] whitespace-pre-wrap rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[13px] leading-relaxed text-slate-100">
              {part.text}
            </div>
          </div>
        )
      }
      return (
        <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-300">
          {part.text}
          {isLast && status === "busy" && (
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-3 w-1.5 animate-pulse rounded-sm bg-blue-400 align-text-bottom"
            />
          )}
        </div>
      )
    case "reasoning":
      return <ThinkingBlock part={part} />
    case "tool":
      return <ToolCard part={part} />
    default:
      return <TimelineRow part={part} />
  }
}

function ThinkingBlock({ part }: { part: Extract<OpencodePart, { type: "reasoning" }> }) {
  const inProgress = part.time?.end == null
  const [open, setOpen] = useState(inProgress)
  const duration =
    part.time?.start != null && part.time?.end != null
      ? Math.max(1, Math.round((part.time.end - part.time.start) / 1000))
      : null

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left transition-colors hover:bg-slate-900"
      >
        {open ? (
          <CaretDownIcon size={12} className="shrink-0 text-slate-500" />
        ) : (
          <CaretRightIcon size={12} className="shrink-0 text-slate-500" />
        )}
        <DotsThreeIcon
          size={14}
          className={cn("shrink-0 text-slate-500", inProgress && "text-blue-400")}
        />
        <span className="text-[11px] font-medium text-slate-400">Thinking</span>
        {inProgress && <CircleNotchIcon size={11} className="animate-spin text-blue-400" />}
        {duration != null && <span className="font-mono text-[10px] text-slate-600">{duration}s</span>}
        <span className="flex-1" />
        <span className="font-mono text-[10px] text-slate-600">{part.id.slice(0, 8)}</span>
      </button>
      {open && (
        <div className="border-t border-slate-800/60 px-2.5 py-2">
          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
            {part.text}
          </p>
        </div>
      )}
    </div>
  )
}

function TimelineRow({ part }: { part: OpencodePart }) {
  if (part.type === "step-finish") {
    return <div className="h-px bg-slate-800/50" />
  }
  const raw = part as Record<string, unknown>
  const label =
    (typeof raw.path === "string" && raw.path) ||
    (typeof raw.title === "string" && raw.title) ||
    (typeof raw.name === "string" && raw.name) ||
    (typeof raw.tool === "string" && raw.tool) ||
    null

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="size-1 shrink-0 rounded-full bg-slate-700" />
      <span className="font-mono text-[10px] uppercase text-slate-600">{part.type}</span>
      {label && <span className="min-w-0 truncate font-mono text-[11px] text-slate-500">{label}</span>}
    </div>
  )
}

function PromptBar({
  disabled,
  placeholder,
  onSend,
}: {
  disabled?: boolean
  placeholder?: string
  onSend: (text: string) => void | Promise<void>
}) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [])

  const send = useCallback(() => {
    const text = value.trim()
    if (!text || disabled) return
    setValue("")
    requestAnimationFrame(resize)
    void onSend(text)
  }, [value, disabled, onSend, resize])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      className="shrink-0 border-t border-slate-800 bg-slate-900/40 px-3 py-2"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            resize()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={placeholder ?? (disabled ? "Agent is working…" : "Send a message to the agent…")}
          disabled={disabled}
          className="max-h-24 min-h-[34px] flex-1 resize-none rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PaperPlaneTiltIcon size={14} />
        </button>
      </div>
    </form>
  )
}
