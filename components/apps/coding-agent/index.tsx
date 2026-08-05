"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ElementType } from "react"
import { useParams } from "next/navigation"
import { useOpencodeSession } from "@/hooks/use-opencode-session"
import type { AppProps } from "@/types/desktop/app"
import type { OpencodeWorkspaceContent } from "@/types/desktop/content"
import type { AppMessage } from "@/types/desktop/events"
import { useSubscribe } from "@/lib/desktop/message-bus"
import { cn } from "@/lib/utils"
import { ChatCircleTextIcon, GlobeIcon, TerminalWindowIcon } from "@phosphor-icons/react"
import { AgentTranscript } from "./transcript"
import { DispatchForm } from "./dispatch-form"
import { SandboxPreview, SandboxTerminal } from "./sandbox-views"
import { StatusBar } from "./status-bar"

type TabId = "agent" | "terminal" | "preview"

const TABS: Array<{ id: TabId; label: string; icon: ElementType }> = [
  { id: "agent", label: "Agent", icon: ChatCircleTextIcon },
  { id: "terminal", label: "Terminal", icon: TerminalWindowIcon },
  { id: "preview", label: "Preview", icon: GlobeIcon },
]

interface ToolResultPayload {
  tool?: string
  previewUrl?: string
  terminalUrl?: string
  output?: string
}

/**
 * Pull signed sandbox URLs out of a tool result. The opencode-subagent tool
 * returns { previewUrl, terminalUrl } inside its JSON output, so we look at
 * both the top-level payload and the parsed output, a few levels deep.
 */
function extractSandboxUrls(payload: ToolResultPayload): {
  previewUrl?: string
  terminalUrl?: string
} {
  const out: { previewUrl?: string; terminalUrl?: string } = {}
  if (typeof payload.previewUrl === "string" && /^https?:\/\//.test(payload.previewUrl)) {
    out.previewUrl = payload.previewUrl
  }
  if (typeof payload.terminalUrl === "string" && /^https?:\/\//.test(payload.terminalUrl)) {
    out.terminalUrl = payload.terminalUrl
  }
  if (typeof payload.output === "string") {
    try {
      const nested = scanForUrls(JSON.parse(payload.output), 0)
      out.previewUrl = out.previewUrl ?? nested.previewUrl
      out.terminalUrl = out.terminalUrl ?? nested.terminalUrl
    } catch {
      // Output is plain text, not JSON — nothing to extract.
    }
  }
  return out
}

function scanForUrls(value: unknown, depth: number): { previewUrl?: string; terminalUrl?: string } {
  if (depth > 2 || !value || typeof value !== "object") return {}
  const out: { previewUrl?: string; terminalUrl?: string } = {}
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "string" && /^https?:\/\//.test(val)) {
      if (key === "previewUrl") out.previewUrl = val
      else if (key === "terminalUrl") out.terminalUrl = val
    } else if (val && typeof val === "object") {
      const nested = scanForUrls(val, depth + 1)
      out.previewUrl = out.previewUrl ?? nested.previewUrl
      out.terminalUrl = out.terminalUrl ?? nested.terminalUrl
    }
  }
  return out
}

export function CodingAgentApp({ content, params }: AppProps) {
  const routeParams = useParams()
  const workspace = content?.type === "opencode-workspace" ? content : undefined
  const propProjectId =
    (params?.projectId as string) ||
    workspace?.projectId ||
    (routeParams?.projectId as string) ||
    ""

  // Live session state — adopted from window content or created by dispatch.
  const [live, setLive] = useState<OpencodeWorkspaceContent | null>(workspace?.url ? workspace : null)
  const [tab, setTab] = useState<TabId>("agent")
  const [toolUrls, setToolUrls] = useState<{ previewUrl?: string; terminalUrl?: string }>({})
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [provisioning, setProvisioning] = useState(false)
  const [dispatchError, setDispatchError] = useState<string | null>(null)
  const sentInitialPrompt = useRef(false)

  // sessionId: null → the hook auto-creates the OpenCode conversation on the
  // sandbox server once connected. The id returned by POST /api/agents/opencode
  // is the persisted AgentSession record id, not an OpenCode conversation id.
  const session = useOpencodeSession({
    baseUrl: live?.url ?? null,
    sessionId: null,
    enabled: Boolean(live?.url),
  })

  // Adopt window content if a live URL arrives after mount (window reopened
  // with an existing sandbox).
  useEffect(() => {
    if (workspace?.url) setLive(workspace)
  }, [workspace])

  // The hook publishes tool activity from every live session to the global bus;
  // only react to tool results while this window has a session attached.
  const handleToolResult = useCallback(
    (msg: AppMessage) => {
      const payload = (msg.payload ?? {}) as ToolResultPayload
      const urls = extractSandboxUrls(payload)
      if (urls.previewUrl || urls.terminalUrl) {
        setToolUrls((prev) => ({
          previewUrl: urls.previewUrl ?? prev.previewUrl,
          terminalUrl: urls.terminalUrl ?? prev.terminalUrl,
        }))
      }
      if (!live) return
      if (payload.tool === "getSandboxPreview" || urls.previewUrl) {
        setTab("preview")
      }
    },
    [live]
  )
  useSubscribe("agent:tool_call_result", handleToolResult, [handleToolResult])

  // Send the dispatch-form prompt once the provisioned session connects.
  useEffect(() => {
    if (!pendingPrompt || !session.sessionId) return
    if (sentInitialPrompt.current) return
    sentInitialPrompt.current = true
    setPendingPrompt(null)
    void session.sendPrompt(pendingPrompt)
  }, [pendingPrompt, session.sessionId, session.sendPrompt])

  const handleStart = useCallback(async (projectId: string, prompt: string) => {
    setProvisioning(true)
    setDispatchError(null)
    sentInitialPrompt.current = false
    try {
      const res = await fetch("/api/agents/opencode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...(prompt.trim() ? { prompt: prompt.trim() } : {}),
          sessionName: prompt.trim().slice(0, 60) || undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error?.message ?? `Request failed: ${res.status}`)
      }
      const data = json?.data as
        | { sessionId: string; sandboxId: string; signedUrl: string; opencodeUrl?: string; expiresIn?: number }
        | undefined
      if (!data?.signedUrl || !data?.sandboxId) {
        throw new Error("Session started without a preview URL")
      }
      setLive({
        type: "opencode-workspace",
        url: data.signedUrl,
        token: "",
        sandboxId: data.sandboxId,
        projectId,
        title: prompt.trim().slice(0, 60) || "Coding agent",
      })
      if (prompt.trim()) setPendingPrompt(prompt.trim())
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : "Failed to start session")
    } finally {
      setProvisioning(false)
    }
  }, [])

  const handleAbort = useCallback(() => {
    void session.abort()
  }, [session.abort])

  // Name of the tool the agent is currently running, for the status bar.
  const currentTool = useMemo(() => {
    if (session.status !== "busy") return null
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const parts = Object.values(session.messages[i].parts)
      for (let j = parts.length - 1; j >= 0; j--) {
        const part = parts[j]
        if (
          part.type === "tool" &&
          (part.state.status === "running" || part.state.status === "pending")
        ) {
          return part.tool
        }
      }
    }
    return null
  }, [session.messages, session.status])

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-200">
      {/* Toolbar — segment tabs */}
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-slate-800 bg-slate-900/60 px-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                active
                  ? "bg-slate-800/90 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <Icon size={13} weight={active ? "fill" : "regular"} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1">
        {!live ? (
          <DispatchForm
            projectId={propProjectId}
            provisioning={provisioning}
            error={dispatchError}
            onStart={handleStart}
          />
        ) : tab === "agent" ? (
          <AgentTranscript
            messages={session.messages}
            status={session.status}
            lastError={session.lastError}
            disabled={session.status === "busy" || !session.sessionId}
            placeholder={session.status === "connecting" ? "Connecting to agent…" : undefined}
            onSend={session.sendPrompt}
          />
        ) : tab === "terminal" ? (
          <SandboxTerminal sandboxId={live.sandboxId} urlFromTool={toolUrls.terminalUrl} />
        ) : (
          <SandboxPreview sandboxId={live.sandboxId} urlFromTool={toolUrls.previewUrl} />
        )}
      </div>

      {/* Status bar */}
      <StatusBar
        status={session.status}
        hasSession={Boolean(live)}
        currentTool={currentTool}
        sandboxId={live?.sandboxId}
        onAbort={handleAbort}
      />
    </div>
  )
}
