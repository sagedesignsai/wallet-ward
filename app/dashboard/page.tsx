"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  SparkleIcon,
  ChatTeardropTextIcon,
  ClockIcon,
  RobotIcon,
} from "@phosphor-icons/react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

import { useSession } from "@/lib/auth-client"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useWorkspacePanelStore } from "@/stores/workspace-panel-store"
import { cn } from "@/lib/utils"
import {
  PromptInput,
  PromptInputProvider,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { Button } from "@/components/ui/button"
import { TimeAgo } from "@/components/dashboard/time-ago"

// ─── Agent type display config ────────────────────────────────────────────────

const AGENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  coding: { label: "Coding", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  content: { label: "Content", color: "text-violet-400", bgColor: "bg-violet-500/15" },
  ops: { label: "Ops", color: "text-amber-400", bgColor: "bg-amber-500/15" },
  research: { label: "Research", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
}

// ─── Recent Session Card ──────────────────────────────────────────────────────

interface RecentSessionCardProps {
  id: string
  title: string
  agentType?: string
  updatedAt: string
  onClick: () => void
}

function RecentSessionCard({
  title,
  agentType,
  updatedAt,
  onClick,
}: RecentSessionCardProps) {
  const agentConfig = agentType ? AGENT_TYPE_CONFIG[agentType] : null

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-muted/20 p-4 text-left transition-all duration-200 hover:border-border/60 hover:bg-muted/30"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ChatTeardropTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium text-foreground">
            {title}
          </span>
        </div>
        {agentConfig && (
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", agentConfig.color, agentConfig.bgColor)}>
            {agentConfig.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ClockIcon className="size-3" />
        <TimeAgo date={updatedAt} />
      </div>
    </button>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

function DashboardLanding() {
  const { setConfig } = useDashboardConfig()
  const { data: sessionData } = useSession()
  const router = useRouter()

  const sessions = useWorkspacePanelStore((s) => s.sessions)
  const activeSessionId = useWorkspacePanelStore((s) => s.activeSessionId)
  const openChat = useWorkspacePanelStore((s) => s.openChat)
  const selectSession = useWorkspacePanelStore((s) => s.selectSession)
  const newSession = useWorkspacePanelStore((s) => s.newSession)

  const user = sessionData?.user
  const firstName = user?.name?.split(" ")[0] ?? null

  // Get the current active session for the chat
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null

  // Sort sessions by updatedAt, take top 5
  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [sessions]
  )

  // Local text state for the input
  const [text, setText] = useState("")

  // Chat hook - only used when we have an active session
  const { sendMessage, status } = useChat({
    id: activeSessionId ?? undefined,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        agentType: activeSession?.agentType || undefined,
      },
    }),
  })

  useEffect(() => {
    setConfig({
      title: "",
      description: "",
      breadcrumbs: [],
    })
  }, [setConfig])

  // Handle prompt submit
  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim()) return

      // Create a new session
      newSession()

      // Open the chat panel
      openChat()

      // Send the message (slight delay to ensure session is created)
      setTimeout(() => {
        sendMessage({ text: message.text! })
      }, 50)

      setText("")
    },
    [newSession, openChat, sendMessage]
  )

  // Handle clicking a recent session
  const handleSessionClick = useCallback(
    (sessionId: string) => {
      selectSession(sessionId)
      openChat()
    },
    [selectSession, openChat]
  )

  const isSubmitDisabled = !text.trim() || status === "streaming"

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      {/* Background visual elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 animate-[pulse_10s_ease-in-out_2s_infinite] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 animate-[pulse_7s_ease-in-out_1s_infinite] rounded-full bg-cyan-500/4 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Welcome message */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <SparkleIcon className="size-5 text-primary" weight="duotone" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {firstName ? `Hey ${firstName}, what can I help you with?` : "What can I help you with?"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Ask Flowspace AI to help with projects, secrets, documents, or launch an autonomous agent.
          </p>
        </div>

        {/* Prompt Input */}
        <PromptInputProvider>
          <PromptInput
            className="w-full"
            onSubmit={handleSubmit}
          >
            <PromptInputBody>
              <PromptInputTextarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask Flowspace AI…"
                className="min-h-[80px] text-base"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>

                <SpeechInput
                  className="shrink-0"
                  onTranscriptionChange={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))}
                  size="icon-sm"
                  variant="ghost"
                />
              </PromptInputTools>
              <PromptInputSubmit disabled={isSubmitDisabled} status={status === "streaming" ? "streaming" : "ready"} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            "Create a new project",
            "Show my secrets",
            "What agents are available?",
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setText(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>

        {/* Recent conversations */}
        {recentSessions.length > 0 && (
          <div className="flex w-full flex-col gap-3 pt-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground">
                Recent conversations
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recentSessions.map((session) => (
                <RecentSessionCard
                  key={session.id}
                  id={session.id}
                  title={session.title}
                  agentType={session.agentType}
                  updatedAt={session.updatedAt}
                  onClick={() => handleSessionClick(session.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardLanding />
}
