"use client";

import { memo } from "react";
import type { UIMessage } from "ai";

// UI message primitives
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";

// AI response components
import {
  MessageActions,
  MessageAction,
  MessageResponse,
} from "@/components/ai-elements/message";

// Tool call / result display
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";

// Reasoning (chain-of-thought)
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";

// Icons
import { CopyIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MessageRendererProps {
  message: UIMessage;
  isStreaming?: boolean;
}

// ─── User Message ─────────────────────────────────────────────────────────────

const UserMessage = memo(function UserMessage({ message }: { message: UIMessage }) {
  const text =
    message.parts?.find((p: any) => p.type === "text")?.text ??
    (message as any).content ??
    "";

  return (
    <Message align="end">
      <MessageContent>
        <div className="text-xs text-muted-foreground">
          {text}
        </div>
      </MessageContent>
    </Message>
  );
});

// ─── Assistant Message ────────────────────────────────────────────────────────

const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming?: boolean;
}) {
  const parts = message.parts ?? [];

  // Separate parts by type for ordered rendering
  const reasoningParts = parts.filter((p: any) => p.type === "reasoning");
  const contentParts = parts.filter(
    (p: any) => p.type === "text" || p.type === "tool-call" || p.type === "tool-result"
  );

  // Collect text for copy action
  const fullText = parts
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join("\n");

  const handleCopy = () => {
    if (fullText) navigator.clipboard.writeText(fullText);
  };

  return (
    <Message align="start">
      <MessageContent>
        {/* Reasoning (if any) */}
        {reasoningParts.map((part: any, i: number) => (
          <Reasoning key={`reasoning-${i}`} isStreaming={isStreaming && i === reasoningParts.length - 1}>
            <ReasoningTrigger />
            <ReasoningContent>{part.text}</ReasoningContent>
          </Reasoning>
        ))}

        {/* Main content parts */}
        {contentParts.map((part: any, i: number) => {
          // Streaming / finished text
          if (part.type === "text") {
            return (
              <MessageResponse key={`text-${i}`} isAnimating={isStreaming}>
                {part.text}
              </MessageResponse>
            );
          }

          // Tool call in progress
          if (part.type === "tool-call") {
            return (
              <Tool key={`tool-call-${i}`}>
                <ToolHeader
                  type="dynamic-tool"
                  state="input-available"
                  toolName={part.toolName}
                />
                <ToolContent>
                  <ToolInput input={part.args} />
                </ToolContent>
              </Tool>
            );
          }

          // Tool result
          if (part.type === "tool-result") {
            return (
              <Tool key={`tool-result-${i}`}>
                <ToolHeader
                  type="dynamic-tool"
                  state={part.isError ? "output-error" : "output-available"}
                  toolName={part.toolName}
                />
                <ToolContent>
                  <ToolInput input={part.args} />
                  <ToolOutput output={part.result} errorText={part.isError ? String(part.result) : undefined} />
                </ToolContent>
              </Tool>
            );
          }

          return null;
        })}

        {/* Empty streaming state */}
        {isStreaming && contentParts.length === 0 && (
          <MessageResponse isAnimating>{""}</MessageResponse>
        )}

        {/* Actions row (copy) — only shown when not streaming */}
        {!isStreaming && fullText && (
          <MessageFooter>
            <MessageActions>
              <MessageAction
                tooltip="Copy"
                label="Copy message"
                onClick={handleCopy}
              >
                <CopyIcon className="size-3" />
              </MessageAction>
            </MessageActions>
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
});

// ─── Main Renderer ────────────────────────────────────────────────────────────

export const MessageRenderer = memo(function MessageRenderer({
  message,
  isStreaming,
}: MessageRendererProps) {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return <AssistantMessage message={message} isStreaming={isStreaming} />;
});
