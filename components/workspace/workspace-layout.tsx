"use client";

import { useWorkspacePanelStore } from "@/stores/workspace-panel-store";
import { useProjectStore } from "@/stores/project-store";
import { AIChatPanel } from "./ai-chat-panel";
import { ComputerPanel } from "./computer-panel";
import { usePendingApprovals } from "@/hooks/use-pending-approvals";
import { Badge } from "@/components/ui/badge";
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

// ─── Floating panel toggle toolbar ────────────────────────────────────────────

function PanelToggleBar() {
  const chatOpen = useWorkspacePanelStore((s) => s.chatOpen);
  const computerOpen = useWorkspacePanelStore((s) => s.computerOpen);
  const toggleChat = useWorkspacePanelStore((s) => s.toggleChat);
  const toggleComputer = useWorkspacePanelStore((s) => s.toggleComputer);
  const { count: proposalCount } = usePendingApprovals();

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              variant={chatOpen ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={toggleChat}
              aria-label="Toggle AI chat"
            >
              <ChatTeardropTextIcon className="size-4" />
            </Button>
            {proposalCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] font-bold animate-pulse"
              >
                {proposalCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          AI Chat {chatOpen ? "(open)" : "(closed)"}
          {proposalCount > 0 && ` · ${proposalCount} pending approval${proposalCount > 1 ? "s" : ""}`}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={computerOpen ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={toggleComputer}
            aria-label="Toggle computer panel"
          >
            <DesktopIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Computer {computerOpen ? "(open)" : "(closed)"}</TooltipContent>
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
  projectId: propProjectId,
  environmentId: propEnvironmentId,
}: WorkspaceLayoutProps) {
  const chatOpen = useWorkspacePanelStore((s) => s.chatOpen);
  const computerOpen = useWorkspacePanelStore((s) => s.computerOpen);
  const toggleComputer = useWorkspacePanelStore((s) => s.toggleComputer);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  
  // Use prop projectId if provided, otherwise use global active project
  const projectId = propProjectId ?? activeProjectId ?? undefined;
  const environmentId = propEnvironmentId;

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
              defaultSize="32%"
              minSize="18%"
              maxSize="37%"

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
