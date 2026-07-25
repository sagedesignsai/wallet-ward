"use client";

import { useWorkspacePanel, type ChatSession } from "@/context/workspace-panel";
import { MessageRenderer } from "@/components/ai-elements/message-renderer";
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
  const {
    state,
    newSession,
    selectSession,
    deleteSession,
    activeSession,
  } = useWorkspacePanel();

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
        {state.sessions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {state.sessions.map((s) => (
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
  const { activeSession, openTab } = useWorkspacePanel();
  const [text, setText] = useState("");

  // Use DefaultChatTransport for structured message parts
  const { messages, sendMessage, status, error, regenerate } = useChat({
    id: activeSession?.id,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        projectId,
        environmentId,
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

  const isSubmitDisabled = !text.trim() || status === "streaming";

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {/* Session header */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <SessionSelector />
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
                Start a conversation with Nimbus AI
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
              placeholder="Ask Nimbus AI…"
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
