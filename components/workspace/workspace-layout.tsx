"use client"

import { useWorkspacePanelStore } from "@/stores/workspace-panel-store"
import { useProjectStore } from "@/stores/project-store"
import { AIChatPanel } from "./ai-chat-panel"
import { ComputerPanel } from "./computer-panel"
import { usePendingApprovals } from "@/hooks/use-pending-approvals"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DesktopIcon,
  ChatTeardropTextIcon,
} from "@phosphor-icons/react"

// ─── Mobile workspace tab toggle ──────────────────────────────────────────────

export function WorkspaceMobileToggle() {
  const workspaceMode = useWorkspacePanelStore((s) => s.workspaceMode)
  const setWorkspaceMode = useWorkspacePanelStore((s) => s.setWorkspaceMode)
  const { count: proposalCount } = usePendingApprovals()

  return (
    <div className="flex items-center gap-1 border-b border-border/60 bg-muted/20 px-2 py-1.5">
      <Button
        variant={workspaceMode === "chat" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5 text-xs"
        onClick={() => setWorkspaceMode("chat")}
      >
        <ChatTeardropTextIcon className="size-3.5" />
        Chat
        {proposalCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-1 h-4 min-w-4 px-1 text-[9px] font-bold"
          >
            {proposalCount}
          </Badge>
        )}
      </Button>
      <Button
        variant={workspaceMode === "canvas" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5 text-xs"
        onClick={() => setWorkspaceMode("canvas")}
      >
        <DesktopIcon className="size-3.5" />
        Canvas
      </Button>
    </div>
  )
}

// ─── Floating panel toggle toolbar (workspace-only) ───────────────────────────

function PanelToggleBar() {
  const chatOpen = useWorkspacePanelStore((s) => s.chatOpen)
  const computerOpen = useWorkspacePanelStore((s) => s.computerOpen)
  const toggleChat = useWorkspacePanelStore((s) => s.toggleChat)
  const toggleComputer = useWorkspacePanelStore((s) => s.toggleComputer)
  const { count: proposalCount } = usePendingApprovals()

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
          {proposalCount > 0 &&
            ` · ${proposalCount} pending approval${proposalCount > 1 ? "s" : ""}`}
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
        <TooltipContent>
          Computer {computerOpen ? "(open)" : "(closed)"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

// ─── Workspace split layout (self-contained, no children) ─────────────────────

export interface WorkspaceSplitLayoutProps {
  projectId?: string
  environmentId?: string
}

// Workspace uses 1024px breakpoint (not the default 768px from useIsMobile)
function useIsWorkspaceMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    const onChange = () => setIsMobile(window.innerWidth < 1024)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < 1024)
    return () => mql.removeEventListener("change", onChange)
  }, [])
  return isMobile
}

export function WorkspaceSplitLayout({
  projectId: propProjectId,
  environmentId: propEnvironmentId,
}: WorkspaceSplitLayoutProps) {
  const workspaceMode = useWorkspacePanelStore((s) => s.workspaceMode)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const isMobile = useIsWorkspaceMobile()

  // Use prop projectId if provided, otherwise use global active project
  const projectId = propProjectId ?? activeProjectId ?? undefined
  const environmentId = propEnvironmentId

  // Mobile: tab toggle between chat and canvas
  if (isMobile) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <WorkspaceMobileToggle />
        <div className="min-h-0 flex-1 overflow-hidden">
          {workspaceMode === "chat" ? (
            <AIChatPanel
              className="h-full"
              projectId={projectId}
              environmentId={environmentId}
            />
          ) : (
            <ComputerPanel variant="panel" className="h-full" />
          )}
        </div>
      </div>
    )
  }

  // Desktop: symmetric 2-column resizable split (Chat | Canvas)
  return (
    <div className="flex h-full overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {/* AI Chat Panel – left column */}
        <ResizablePanel
          id="chat"
          collapsible
          collapsedSize="0%"
          defaultSize="30%"
          minSize="20%"
          maxSize="45%"
        >
          <AIChatPanel
            className="h-full"
            projectId={projectId}
            environmentId={environmentId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Agent Work Canvas – right column (always fills remaining space) */}
        <ResizablePanel id="canvas" defaultSize="70%" minSize="25%">
          <ComputerPanel variant="panel" className="h-full" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

// Export the toggle bar for backward compatibility
export { PanelToggleBar }