"use client";

import { useWorkspacePanel, type ChatSession } from "@/context/workspace-panel";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
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
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { MODEL_PRESETS, DEFAULT_MODEL_ID } from "@/lib/ai/config";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  CheckIcon,
  GlobeIcon,
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  ChatTeardropTextIcon,
  CaretDownIcon,
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

// Group presets by provider label
const MODEL_GROUPS = MODEL_PRESETS.reduce<Record<string, typeof MODEL_PRESETS>>(
  (acc, p) => {
    if (!acc[p.providerLabel]) acc[p.providerLabel] = [];
    acc[p.providerLabel].push(p);
    return acc;
  },
  {}
);

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

  const [modelPresetId, setModelPresetId] = useState(DEFAULT_MODEL_ID);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [text, setText] = useState("");
  const [webSearch, setWebSearch] = useState(false);

  const selectedPreset = useMemo(
    () => MODEL_PRESETS.find((p) => p.id === modelPresetId)!,
    [modelPresetId]
  );

  const { messages, sendMessage, status, error } = useChat({
    id: activeSession?.id,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        modelPresetId,
        systemPrompt: "secretsManager",
        useTools: true,
        webSearch,
        projectId,
        environmentId,
      },
    }),
    onFinish({ message }) {
      // Extract text from message parts
      const text = message.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("") ?? "";
      // If response contains code blocks, push to computer panel
      const codeMatch = text.match(/```(\w+)?\n([\s\S]*?)```/);
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
    },
  });

  const chatStatus = useMemo<"ready" | "submitted" | "streaming" | "error">(
    () =>
      error
        ? "error"
        : status === "streaming"
          ? "streaming"
          : status === "submitted"
            ? "submitted"
            : "ready",
    [status, error]
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim() && !message.files?.length) return;
      if (message.files?.length) toast.success(`${message.files.length} file(s) attached`);
      sendMessage({ text: message.text || "(attachment)" });
      setText("");
    },
    [sendMessage]
  );

  const handleSuggestion = useCallback(
    (s: string) => { sendMessage({ text: s }); },
    [sendMessage]
  );

  const handleTranscription = useCallback((t: string) => {
    setText((prev) => (prev ? `${prev} ${t}` : t));
  }, []);

  const handleModelSelect = useCallback((id: string) => {
    setModelPresetId(id);
    setModelSelectorOpen(false);
  }, []);

  const isSubmitDisabled = !text.trim() || chatStatus === "streaming";

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
              chatStatus === "submitted" ? "bg-amber-500 animate-pulse" :
              chatStatus === "error" ? "bg-red-500" :
              "bg-muted"
            )}
          />
          <span className="text-[10px] text-muted-foreground capitalize">
            {chatStatus === "streaming" ? "thinking…" :
             chatStatus === "submitted" ? "sending…" :
             chatStatus === "error" ? "error" : "ready"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Nimbus AI</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your intelligent workspace assistant
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message
                key={message.id}
                from={message.role === "user" ? "user" : "assistant"}
              >
                <div>
                  {/* Sources */}
                  {message.parts
                    ?.filter((p) => p.type === "source-url" || p.type === "source-document")
                    .map((p) =>
                      p.type === "source-url" ? (
                        <Sources key={p.sourceId}>
                          <SourcesTrigger count={1} />
                          <SourcesContent>
                            <Source href={p.url} title={p.title ?? p.url} />
                          </SourcesContent>
                        </Sources>
                      ) : p.type === "source-document" ? (
                        <Sources key={p.sourceId}>
                          <SourcesTrigger count={1} />
                          <SourcesContent>
                            <Source href="#" title={p.title} />
                          </SourcesContent>
                        </Sources>
                      ) : null
                    )}

                  {/* Reasoning */}
                  {message.parts
                    ?.filter((p) => p.type === "reasoning")
                    .map((p, i) =>
                      p.type === "reasoning" ? (
                        <Reasoning key={i} duration={0}>
                          <ReasoningTrigger />
                           <ReasoningContent>{p.text}</ReasoningContent>
                        </Reasoning>
                      ) : null
                    )}

                  <MessageContent>
                    <MessageResponse>
                      {(message.parts ?? [])
                        .filter((p) => p.type === "text")
                        .map((p) => (p.type === "text" ? p.text : ""))
                        .join("")}
                    </MessageResponse>
                  </MessageContent>
                </div>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Suggestions */}
      {messages.length === 0 && (
        <Suggestions className="px-3 pb-2">
          {SUGGESTIONS.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={handleSuggestion} />
          ))}
        </Suggestions>
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

              <PromptInputButton
                onClick={() => setWebSearch((v) => !v)}
                variant={webSearch ? "default" : "ghost"}
                title="Web search"
              >
                <GlobeIcon size={15} />
              </PromptInputButton>

              <ModelSelector
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
              >
                <ModelSelectorTrigger asChild>
                  <PromptInputButton title={selectedPreset.name}>
                    <ModelSelectorLogo provider={selectedPreset.providerSlug} />
                  </PromptInputButton>
                </ModelSelectorTrigger>
                <ModelSelectorContent>
                  <ModelSelectorInput placeholder="Search…" />
                  <ModelSelectorList>
                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                    {Object.entries(MODEL_GROUPS).map(([group, presets]) => (
                      <ModelSelectorGroup key={group} heading={group}>
                        {presets.map((p) => (
                          <ModelSelectorItem
                            key={p.id}
                            value={p.id}
                            onSelect={() => handleModelSelect(p.id)}
                          >
                            <ModelSelectorLogo provider={p.providerSlug} />
                            <ModelSelectorName>{p.name}</ModelSelectorName>
                            {modelPresetId === p.id && (
                              <CheckIcon className="ml-auto size-4" />
                            )}
                          </ModelSelectorItem>
                        ))}
                      </ModelSelectorGroup>
                    ))}
                  </ModelSelectorList>
                </ModelSelectorContent>
              </ModelSelector>
            </PromptInputTools>
            <PromptInputSubmit disabled={isSubmitDisabled} status={chatStatus} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
