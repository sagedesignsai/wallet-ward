"use client";

import { useWorkspacePanel, type ComputerTab } from "@/context/workspace-panel";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactClose,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { CodeBlock } from "@/components/ai-elements/code-block";
import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from "@/components/ai-elements/file-tree";
import { Terminal } from "@/components/ai-elements/terminal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CodeIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  KeyIcon,
  ListChecksIcon,
  TerminalIcon,
  FolderIcon,
  PushPinIcon,
  XIcon,
  PlusIcon,
  ArrowsOutIcon,
  CopyIcon,
  DownloadIcon,
} from "@phosphor-icons/react";
import type { FileNode } from "@/context/workspace-panel";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Tab icon mapping ──────────────────────────────────────────────────────────

function TabIcon({ type }: { type: ComputerTab["type"] }) {
  const cls = "size-3.5 shrink-0";
  switch (type) {
    case "code":      return <CodeIcon className={cls} />;
    case "document":  return <FileTextIcon className={cls} />;
    case "artifact":  return <GlobeIcon className={cls} />;
    case "preview":   return <GlobeIcon className={cls} />;
    case "terminal":  return <TerminalIcon className={cls} />;
    case "secret":    return <KeyIcon className={cls} />;
    case "task":      return <ListChecksIcon className={cls} />;
    case "image":     return <ImageIcon className={cls} />;
    case "file-tree": return <FolderIcon className={cls} />;
    default:          return <FileTextIcon className={cls} />;
  }
}

// ─── Individual content renderers ─────────────────────────────────────────────

function CodeRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "code"; code: string; language: string; filename?: string };
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content.code);
    toast.success("Copied to clipboard");
  }, [content.code]);

  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle className="font-mono">{content.filename ?? tab.title}</ArtifactTitle>
        <ArtifactActions>
          <ArtifactAction tooltip="Copy" icon={CopyIcon} onClick={handleCopy} />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="p-0">
        <CodeBlock code={content.code} language={content.language as any} />
      </ArtifactContent>
    </Artifact>
  );
}

function DocumentRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "document"; title: string; body: string; editable?: boolean };
  const [body, setBody] = useState(content.body);
  const [editing, setEditing] = useState(false);

  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle>{content.title}</ArtifactTitle>
        <ArtifactActions>
          {content.editable && (
            <Button
              size="sm"
              variant={editing ? "default" : "ghost"}
              className="h-7 text-xs"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          )}
          <ArtifactAction
            tooltip="Copy"
            icon={CopyIcon}
            onClick={() => {
              navigator.clipboard.writeText(body);
              toast.success("Copied");
            }}
          />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent>
        {editing ? (
          <textarea
            className="w-full h-full min-h-[400px] resize-none rounded-md border border-border/60 bg-muted/30 p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoFocus
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {body || <span className="text-muted-foreground italic">Empty document</span>}
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}

function ArtifactRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "artifact"; title: string; description?: string; code?: string; language?: string; html?: string };
  const [view, setView] = useState<"preview" | "code">(content.html ? "preview" : "code");

  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle>{content.title}</ArtifactTitle>
        <ArtifactActions>
          {content.html && content.code && (
            <div className="flex rounded-md border border-border/60 overflow-hidden">
              <Button
                size="sm"
                variant={view === "preview" ? "secondary" : "ghost"}
                className="h-6 rounded-none text-xs px-2"
                onClick={() => setView("preview")}
              >Preview</Button>
              <Button
                size="sm"
                variant={view === "code" ? "secondary" : "ghost"}
                className="h-6 rounded-none text-xs px-2"
                onClick={() => setView("code")}
              >Code</Button>
            </div>
          )}
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className={view === "preview" ? "p-0" : undefined}>
        {view === "preview" && content.html ? (
          <iframe
            srcDoc={content.html}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title={content.title}
          />
        ) : content.code ? (
          <CodeBlock code={content.code} language={(content.language ?? "tsx") as any} />
        ) : (
          <p className="text-muted-foreground text-sm italic">No content</p>
        )}
      </ArtifactContent>
    </Artifact>
  );
}

function PreviewRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "preview"; url: string };
  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle className="font-mono text-xs">{content.url}</ArtifactTitle>
        <ArtifactActions>
          <ArtifactAction
            tooltip="Open in new tab"
            icon={ArrowsOutIcon}
            onClick={() => window.open(content.url, "_blank")}
          />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="p-0">
        <iframe
          src={content.url}
          className="w-full h-full border-0"
          title={tab.title}
        />
      </ArtifactContent>
    </Artifact>
  );
}

function TerminalRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "terminal"; lines: string[]; title?: string };
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when lines change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content.lines.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Sandbox header when pinned */}
      {tab.pinned && (
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-zinc-300">Daytona Sandbox</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">{content.title}</span>
          </div>
        </div>
      )}
      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-zinc-950 p-4 font-mono text-xs leading-5"
      >
        {content.lines.map((line, i) => (
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
  );
}

function SecretRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "secret"; name: string; secretType: string; resourceId: string };
  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <div className="flex items-center gap-2">
          <ArtifactTitle className="font-mono">{content.name}</ArtifactTitle>
          <Badge variant="outline" className="text-[0.625rem]">{content.secretType}</Badge>
        </div>
      </ArtifactHeader>
      <ArtifactContent>
        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Value</p>
            <p className="font-mono text-sm tracking-widest">••••••••••••••••</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Secret values are masked for security. Use the Secrets tab to reveal values.
          </p>
        </div>
      </ArtifactContent>
    </Artifact>
  );
}

function TaskRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "task"; title: string; description?: string; status: string };
  const statusColors: Record<string, string> = {
    todo: "bg-muted text-muted-foreground",
    in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    done: "bg-green-500/15 text-green-600 dark:text-green-400",
  };
  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle>{content.title}</ArtifactTitle>
        <ArtifactActions>
          <Badge className={cn("text-xs", statusColors[content.status] ?? "bg-muted")}>
            {content.status.replace("_", " ")}
          </Badge>
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent>
        {content.description ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
            {content.description}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">No description</p>
        )}
      </ArtifactContent>
    </Artifact>
  );
}

function ImageRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "image"; url: string; alt?: string };
  return (
    <div className="h-full flex items-center justify-center bg-checkerboard p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={content.url}
        alt={content.alt ?? tab.title}
        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
      />
    </div>
  );
}

function FileTreeRenderer({ tab }: { tab: ComputerTab }) {
  const content = tab.content as { type: "file-tree"; title: string; tree: FileNode[]; selectedPath?: string };
  const [selected, setSelected] = useState(content.selectedPath ?? "");

  function renderNode(node: FileNode) {
    if (node.type === "folder") {
      return (
        <FileTreeFolder key={node.path} path={node.path} name={node.name}>
          {node.children?.map(renderNode)}
        </FileTreeFolder>
      );
    }
    return (
      <FileTreeFile key={node.path} path={node.path} name={node.name} />
    );
  }

  return (
    <Artifact className="h-full border-0 rounded-none">
      <ArtifactHeader>
        <ArtifactTitle>{content.title}</ArtifactTitle>
      </ArtifactHeader>
      <ArtifactContent className="p-2">
        <FileTree
          selectedPath={selected}
          onSelect={setSelected}
          defaultExpanded={new Set(["root"])}
          className="border-0 rounded-none bg-transparent"
        >
          {content.tree.map(renderNode)}
        </FileTree>
        {selected && (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-2">
            <p className="font-mono text-xs text-muted-foreground truncate">{selected}</p>
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}

// ─── Tab content dispatcher ───────────────────────────────────────────────────

function TabContent({ tab }: { tab: ComputerTab }) {
  switch (tab.type) {
    case "code":      return <CodeRenderer tab={tab} />;
    case "document":  return <DocumentRenderer tab={tab} />;
    case "artifact":  return <ArtifactRenderer tab={tab} />;
    case "preview":   return <PreviewRenderer tab={tab} />;
    case "terminal":  return <TerminalRenderer tab={tab} />;
    case "secret":    return <SecretRenderer tab={tab} />;
    case "task":      return <TaskRenderer tab={tab} />;
    case "image":     return <ImageRenderer tab={tab} />;
    case "file-tree": return <FileTreeRenderer tab={tab} />;
    default:          return <div className="p-4 text-muted-foreground text-sm">Unknown content type</div>;
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function ComputerEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
      <div className="rounded-xl border border-dashed border-border/60 p-8 space-y-3">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
            <CodeIcon className="size-7 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="font-semibold">Computer Panel</p>
          <p className="text-sm text-muted-foreground mt-1">
            Open a document, code file, task, or secret from anywhere to view and edit it here.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {(["code", "document", "task", "secret", "artifact", "terminal"] as const).map((t) => (
            <div key={t} className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              <TabIcon type={t} />
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Computer Panel ──────────────────────────────────────────────────────

export function ComputerPanel({ className }: { className?: string }) {
  const { state, closeTab, setActiveTab, pinTab, openTab } = useWorkspacePanel();
  const { tabs, activeTabId } = state;
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Tab bar */}
      {tabs.length > 0 && (
        <div className="flex items-center border-b border-border/60 bg-muted/20 min-h-9 overflow-x-auto">
          <ScrollArea orientation="horizontal" className="flex-1">
            <div className="flex items-center">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group flex h-9 min-w-0 max-w-[180px] shrink-0 items-center gap-1.5 border-r border-border/40 px-3 text-xs transition-colors",
                    tab.id === activeTabId
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <TabIcon type={tab.type} />
                  <span className="truncate">{tab.title}</span>
                  {tab.pinned && <PushPinIcon className="size-3 shrink-0 text-primary" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="ml-1 shrink-0 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                    aria-label="Close tab"
                  >
                    <XIcon className="size-3" />
                  </button>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* New tab placeholder */}
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center border-l border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label="New tab"
            title="Ask AI to open something"
          >
            <PlusIcon className="size-3.5" />
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab ? (
          <TabContent tab={activeTab} />
        ) : (
          <ComputerEmptyState />
        )}
      </div>
    </div>
  );
}
