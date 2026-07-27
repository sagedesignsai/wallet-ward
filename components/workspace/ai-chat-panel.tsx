"use client";

import { useWorkspacePanelStore, type ChatSession } from "@/stores/workspace-panel-store";
import { MessageRenderer } from "@/components/ai-elements/message-renderer";
import { usePendingApprovals } from "@/hooks/use-pending-approvals";
import { ApprovalCard } from "@/components/proposals/approval-card";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  ChatTeardropTextIcon,
  CaretDownIcon,
  ArrowClockwiseIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

// ─── Agent type display config ────────────────────────────────────────────────

const AGENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  coding: { label: "Coding Agent", color: "text-blue-400" },
  content: { label: "Content Agent", color: "text-violet-400" },
  ops: { label: "Ops Agent", color: "text-amber-400" },
  research: { label: "Research Agent", color: "text-emerald-400" },
};

const SUGGESTIONS = [
  "What's in this project?",
  "Help me write a document",
  "Find security issues in my secrets",
  "Generate a strong password",
  "Summarize recent activity",
  "Create a task for me",
];

// ─── Attachment display ────────────────────────────────────────────────────────

function AttachmentsDisplay() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-1">
      {attachments.files.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-xs"
        >
          <span className="truncate max-w-[100px]">{a.filename ?? a.mediaType}</span>
          <button
            onClick={() => attachments.remove(a.id)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Session selector ─────────────────────────────────────────────────────────

function SessionSelector() {
  const sessions = useWorkspacePanelStore((s) => s.sessions);
  const activeSessionId = useWorkspacePanelStore((s) => s.activeSessionId);
  const newSession = useWorkspacePanelStore((s) => s.newSession);
  const selectSession = useWorkspacePanelStore((s) => s.selectSession);
  const deleteSession = useWorkspacePanelStore((s) => s.deleteSession);
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 max-w-[160px] gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChatTeardropTextIcon className="size-3.5 shrink-0" />
          <span className="truncate">{activeSession?.title ?? "New conversation"}</span>
          <CaretDownIcon className="size-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem
          onClick={() => newSession()}
          className="gap-2 text-xs font-medium"
        >
          <PlusIcon className="size-3.5" />
          New conversation
        </DropdownMenuItem>
        {sessions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {sessions.map((s) => (
              <div
                key={s.id}
                className="group flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
              >
                <button
                  className="flex-1 truncate text-left"
                  onClick={() => selectSession(s.id)}
                >
                  <span
                    className={cn(
                      "truncate",
                      s.id === activeSession?.id && "font-medium text-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    · {s.messages.length} msg
                  </span>
                </button>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  aria-label="Delete session"
                >
                  <TrashIcon className="size-3" />
                </button>
              </div>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Chat Panel ──────────────────────────────────────────────────────────

export function AIChatPanel({
  className,
  projectId,
  environmentId,
}: {
  className?: string;
  projectId?: string;
  environmentId?: string;
}) {
  const sessions = useWorkspacePanelStore((s) => s.sessions);
  const activeSessionId = useWorkspacePanelStore((s) => s.activeSessionId);
  const tabs = useWorkspacePanelStore((s) => s.tabs);
  const openTab = useWorkspacePanelStore((s) => s.openTab);
  const openComputer = useWorkspacePanelStore((s) => s.openComputer);
  const appendTerminalLines = useWorkspacePanelStore((s) => s.appendTerminalLines);
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const [text, setText] = useState("");
  const { proposals, count: proposalCount, refresh: refreshProposals } = usePendingApprovals();

  const agentType = activeSession?.agentType;
  const agentInfo = agentType ? AGENT_TYPE_LABELS[agentType] : null;

  // Use DefaultChatTransport for structured message parts
  const { messages, sendMessage, status, error, regenerate } = useChat({
    id: activeSession?.id,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        projectId,
        environmentId,
        agentType: agentType || undefined,
      },
    }),
    onFinish: ({ message }) => {
      // Extract code from message parts
      message.parts?.forEach((part: any) => {
        if (part.type === "text") {
          const codeMatch = part.text.match(/```(\w+)?\n([\s\S]*?)```/);
          if (codeMatch) {
            openTab({
              type: "code",
              title: `Generated · ${codeMatch[1] ?? "code"}`,
              content: {
                type: "code",
                code: codeMatch[2],
                language: codeMatch[1] ?? "text",
              },
            });
          }
        }

        // Daytona tool invocation detection
        if (part.type === "tool-invocation" && part.toolInvocation?.state === "result") {
          const { toolName, result, args } = part.toolInvocation;

          if (toolName === "createSandbox" && result?.id) {
            openComputer();
            openTab({
              type: "terminal",
              title: `Sandbox: ${result.name || result.id}`,
              pinned: true,
              content: {
                type: "terminal",
                lines: [
                  `\x1b[36m╭─ Daytona Sandbox ─────────────────────────────────────╮\x1b[0m`,
                  `\x1b[36m│\x1b[0m  Name:   ${result.name || "unnamed"}`,
                  `\x1b[36m│\x1b[0m  ID:     ${result.id}`,
                  `\x1b[36m│\x1b[0m  State:  ${result.state}`,
                  `\x1b[36m│\x1b[0m  CPU:    ${result.cpu}  |  RAM: ${result.memory}GB  |  Disk: ${result.disk}GB`,
                  `\x1b[36m╰──────────────────────────────────────────────────────╯\x1b[0m`,
                  "",
                ],
                title: `Sandbox: ${result.name || result.id}`,
              },
            });
          }

          if (toolName === "executeCommand" && result) {
            const terminalTab = tabs.findLast(
              (t) => t.type === "terminal" && t.pinned
            );
            if (terminalTab) {
              const cmd = args?.command || "unknown";
              const output = result.result || result.output || JSON.stringify(result);
              const exitCode = result.exitCode ?? 0;
              const exitColor = exitCode === 0 ? "\x1b[32m" : "\x1b[31m";
              appendTerminalLines(terminalTab.id, [
                `\x1b[1m$ ${cmd}\x1b[0m`,
                output,
                `${exitColor}exit: ${exitCode}\x1b[0m`,
                "",
              ]);
            }
          }

          if (toolName === "getSandboxPreview" && result?.url) {
            openTab({
              type: "preview",
              title: `Preview`,
              content: {
                type: "preview",
                url: result.url,
              },
            });
          }

          if (toolName === "startDesktop" && result?.desktopUrl) {
            openComputer();
            openTab({
              type: "desktop",
              title: `Desktop: ${result.sandboxId?.slice(0, 8) || "Sandbox"}`,
              sandboxId: result.sandboxId,
              content: {
                type: "desktop",
                url: result.desktopUrl,
                token: result.token,
                sandboxId: result.sandboxId,
                sandboxName: `Sandbox ${result.sandboxId?.slice(0, 8) || ""}`,
              },
            });
          }

          if (toolName === "getWebTerminalUrl" && result?.url) {
            openComputer();
            openTab({
              type: "web-terminal",
              title: `Terminal: ${result.sandboxId?.slice(0, 8) || "Sandbox"}`,
              sandboxId: result.sandboxId,
              content: {
                type: "web-terminal",
                url: result.url,
                token: result.token,
                sandboxId: result.sandboxId,
                sandboxName: `Sandbox ${result.sandboxId?.slice(0, 8) || ""}`,
              },
            });
          }

          if (toolName === "computerUse" && result?.screenshot) {
            openComputer();
            const dataUrl = `data:image/png;base64,${result.screenshot}`
            openTab({
              type: "image",
              title: `Screenshot (${result.sizeBytes ? Math.round(result.sizeBytes / 1024) + "KB" : ""})`,
              content: {
                type: "image",
                url: dataUrl,
                alt: "Desktop screenshot",
              },
            });
          }

          if (toolName === "listSandboxFiles" && result?.files) {
            const tree = result.files.map((f: { name: string; isDir: boolean }) => ({
              name: f.name,
              path: `${result.path}/${f.name}`,
              type: f.isDir ? "folder" as const : "file" as const,
            }))
            openComputer();
            openTab({
              type: "file-tree",
              title: `Files: ${result.path}`,
              content: {
                type: "file-tree",
                title: result.path,
                tree,
              },
            });
          }
        }
      });
    },
    onError: (error) => {
      console.error("[Chat error]", error);
    },
  });

  const chatStatus = useMemo<"ready" | "streaming" | "error">(
    () =>
      error
        ? "error"
        : status === "streaming"
          ? "streaming"
          : "ready",
    [status, error]
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim() && !message.files?.length) return;
      if (message.files?.length) toast.success(`${message.files.length} file(s) attached`);
      
      sendMessage({
        text: message.text || "(attachment)",
        files: message.files,
      });
      
      setText("");
    },
    [sendMessage]
  );

  const handleSuggestion = useCallback(
    (s: string) => { 
      sendMessage({ text: s }); 
    },
    [sendMessage]
  );

  const handleTranscription = useCallback((t: string) => {
    setText((prev) => (prev ? `${prev} ${t}` : t));
  }, []);

  const handleApprove = useCallback(async (proposalId: string, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/proposals/${proposalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast.success("Proposal approved");
      refreshProposals();
    } catch (error) {
      toast.error("Failed to approve proposal");
      console.error(error);
    }
  }, [projectId, refreshProposals]);

  const handleReject = useCallback(async (proposalId: string, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/proposals/${proposalId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      toast.success("Proposal rejected");
      refreshProposals();
    } catch (error) {
      toast.error("Failed to reject proposal");
      console.error(error);
    }
  }, [projectId, refreshProposals]);

  const isSubmitDisabled = !text.trim() || status === "streaming";

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {/* Session header */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <SessionSelector />
          {agentInfo && (
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide shrink-0", agentInfo.color)}>
              {agentInfo.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "size-1.5 rounded-full transition-colors",
              chatStatus === "streaming" ? "bg-green-500 animate-pulse" :
              "bg-muted"
            )}
          />
          <span className="text-[10px] text-muted-foreground capitalize">
            {chatStatus === "streaming" ? "thinking…" : "ready"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-xs text-muted-foreground">
                Start a conversation with Flowspace AI
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageRenderer
                  key={message.id}
                  message={message}
                  isStreaming={status === "streaming" && index === messages.length - 1}
                />
              ))}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Error inline */}
      {chatStatus === "error" && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
          <WarningCircleIcon className="size-3.5 shrink-0 text-destructive" />
          <span className="flex-1 truncate text-destructive/80">
            {error?.message || "Something went wrong."}
          </span>
          <button
            onClick={() => regenerate()}
            className="shrink-0 font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Pending Approvals */}
      {proposalCount > 0 && (
        <div className="border-t border-amber-500/20 bg-amber-500/5 px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <WarningCircleIcon className="size-4 text-amber-400 shrink-0" weight="fill" />
            <span className="text-xs font-semibold text-amber-400">
              {proposalCount} action{proposalCount > 1 ? "s" : ""} awaiting approval
            </span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {proposals.slice(0, 3).map((proposal) => (
              <ApprovalCard
                key={proposal.id}
                proposal={proposal}
                onApprove={handleApprove}
                onReject={handleReject}
                className="text-xs"
              />
            ))}
            {proposalCount > 3 && (
              <p className="text-[10px] text-muted-foreground text-center py-1">
                +{proposalCount - 3} more in{" "}
                <a href="/dashboard/proposals" className="underline hover:text-foreground">
                  proposals page
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/60 px-3 py-2">
        <PromptInput globalDrop multiple onSubmit={handleSubmit}>
          <PromptInputHeader>
            <AttachmentsDisplay />
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask Flowspace AI…"
              className="text-sm min-h-[60px]"
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
                onTranscriptionChange={handleTranscription}
                size="icon-sm"
                variant="ghost"
              />
            </PromptInputTools>
            <PromptInputSubmit disabled={isSubmitDisabled} status={chatStatus} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
