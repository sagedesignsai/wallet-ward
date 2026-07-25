"use client";

import { useRef, useEffect } from "react";
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DesktopIcon,
  ChatTeardropTextIcon,
} from "@phosphor-icons/react";
import type { PanelImperativeHandle } from "react-resizable-panels";

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
  const { state, toggleComputer } = useWorkspacePanel();
  const { chatOpen, computerOpen } = state;

  const chatPanelRef = useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    const panel = chatPanelRef.current;
    if (!panel) return;
    if (chatOpen) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, [chatOpen]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* 2-column resizable split: Chat | Content */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full"
      >
        {/* AI Chat Panel – collapsible when closed */}
        {chatOpen && (
          <>
            <ResizablePanel
              id="chat"
              collapsible
              collapsedSize="0%"
              defaultSize="28%"
              minSize="18%"
              maxSize="35%"
              panelRef={chatPanelRef}
              className="border-r border-border/60"
            >
              <AIChatPanel
                className="h-full"
                projectId={projectId}
                environmentId={environmentId}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Content – always fills remaining space */}
        <ResizablePanel
          id="content"
          defaultSize="100%"
          minSize="25%"
        >
          <div className="h-full overflow-auto">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Computer Panel – slides in as a Sheet overlay from the right */}
      <Sheet open={computerOpen} onOpenChange={(open: boolean) => !open && toggleComputer()}>
        <SheetContent
          side="right"
          className="w-[60vw] p-0 max-w-none sm:max-w-none"
          showCloseButton
        >
          <SheetTitle className="sr-only">Computer</SheetTitle>
          <ComputerPanel className="h-full" />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Export the toggle bar so the header can mount it
export { PanelToggleBar };
