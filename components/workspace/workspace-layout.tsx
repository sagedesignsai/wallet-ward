"use client";

import { useWorkspacePanel } from "@/context/workspace-panel";
import { AIChatPanel } from "./ai-chat-panel";
import { ComputerPanel } from "./computer-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DesktopIcon,
  ChatTeardropTextIcon,
} from "@phosphor-icons/react";

// ─── Floating panel toggle toolbar ────────────────────────────────────────────

function PanelToggleBar() {
  const { state, toggleChat, toggleComputer } = useWorkspacePanel();

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={state.chatOpen ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={toggleChat}
            aria-label="Toggle AI chat"
          >
            <ChatTeardropTextIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>AI Chat {state.chatOpen ? "(open)" : "(closed)"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={state.computerOpen ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={toggleComputer}
            aria-label="Toggle computer panel"
          >
            <DesktopIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Computer {state.computerOpen ? "(open)" : "(closed)"}</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ─── Main workspace layout ─────────────────────────────────────────────────────

export interface WorkspaceLayoutProps {
  children: React.ReactNode;
  projectId?: string;
  environmentId?: string;
}

export function WorkspaceLayout({
  children,
  projectId,
  environmentId,
}: WorkspaceLayoutProps) {
  const { state } = useWorkspacePanel();
  const { chatOpen, computerOpen } = state;

  // When neither panel is open, render just the content
  if (!chatOpen && !computerOpen) {
    return <>{children}</>;
  }

  // All three panes visible: Chat | Content | Computer
  if (chatOpen && computerOpen) {
    return (
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full"
      >
        {/* AI Chat Panel */}
        <ResizablePanel
          id="chat"
          defaultSize={22}
          minSize={18}
          maxSize={35}
          className="border-r border-border/60"
        >
          <AIChatPanel
            className="h-full"
            projectId={projectId}
            environmentId={environmentId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content */}
        <ResizablePanel
          id="content"
          defaultSize={40}
          minSize={25}
        >
          <div className="h-full overflow-auto p-4 md:p-6">
            {children}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Computer Panel */}
        <ResizablePanel
          id="computer"
          defaultSize={38}
          minSize={25}
          maxSize={60}
          className="border-l border-border/60"
        >
          <ComputerPanel className="h-full" />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // Chat + Content (no computer)
  if (chatOpen && !computerOpen) {
    return (
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full"
      >
        <ResizablePanel
          id="chat"
          defaultSize={28}
          minSize={20}
          maxSize={40}
          className="border-r border-border/60"
        >
          <AIChatPanel
            className="h-full"
            projectId={projectId}
            environmentId={environmentId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel id="content" defaultSize={72} minSize={50}>
          <div className="h-full overflow-auto p-4 md:p-6">
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // Computer + Content (no chat)
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full"
    >
      <ResizablePanel id="content" defaultSize={45} minSize={30}>
        <div className="h-full overflow-auto p-4 md:p-6">
          {children}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        id="computer"
        defaultSize={55}
        minSize={30}
        className="border-l border-border/60"
      >
        <ComputerPanel className="h-full" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

// Export the toggle bar so the header can mount it
export { PanelToggleBar };
