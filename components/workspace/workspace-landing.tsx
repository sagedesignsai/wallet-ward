"use client"

import { useMemo, useState, useCallback } from "react"
import {
  SparkleIcon,
  ChatTeardropTextIcon,
  ClockIcon,
} from "@phosphor-icons/react"

import { useSession } from "@/lib/auth-client"
import {
  useDashboardConfigStore,
  type DashboardConfig,
} from "@/stores/dashboard-config"
import { useWorkspacePanelStore } from "@/stores/workspace-panel-store"
import { useWorkspaceNavigation } from "@/hooks/use-workspace-navigation"
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

const AGENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  coding: {
    label: "Coding",
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
  },
  content: {
    label: "Content",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
  },
  ops: { label: "Ops", color: "text-amber-400", bgColor: "bg-amber-500/15" },
  research: {
    label: "Research",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
  },
}

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
        <div className="flex min-w-0 items-center gap-2">
          <ChatTeardropTextIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium text-foreground">
            {title}
          </span>
        </div>
        {agentConfig && (
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
              agentConfig.color,
              agentConfig.bgColor
            )}
          >
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

export function WorkspaceLanding({ config }: { config?: DashboardConfig }) {
  const { data: sessionData } = useSession()

  const sessions = useWorkspacePanelStore((s) => s.sessions)
  const newSession = useWorkspacePanelStore((s) => s.newSession)
  const { openWorkspace } = useWorkspaceNavigation()

  // Publish header config during render (no effect / no flash)
  if (config) useDashboardConfigStore.setState(config)

  const user = sessionData?.user
  const firstName = user?.name?.split(" ")[0] ?? null

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [sessions]
  )

  const [text, setText] = useState("")

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim()) return
      const sessionId = newSession()
      openWorkspace({ sessionId, prompt: message.text })
      setText("")
    },
    [newSession, openWorkspace]
  )

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      openWorkspace({ sessionId })
    },
    [openWorkspace]
  )

  const isSubmitDisabled = !text.trim()

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <SparkleIcon className="size-5 text-primary" weight="duotone" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {firstName
              ? `Hey ${firstName}, what can I help you with?`
              : "What can I help you with?"}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Ask Flowspace AI to help with projects, secrets, documents, or
            launch an autonomous agent.
          </p>
        </div>

        <PromptInputProvider>
          <PromptInput className="w-full" onSubmit={handleSubmit}>
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
                  onTranscriptionChange={(t) =>
                    setText((prev) => (prev ? `${prev} ${t}` : t))
                  }
                  size="icon-sm"
                  variant="ghost"
                />
              </PromptInputTools>
              <PromptInputSubmit disabled={isSubmitDisabled} status="ready" />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>

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
