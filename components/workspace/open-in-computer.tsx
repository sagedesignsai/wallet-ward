"use client";

import { useWorkspacePanelStore, type ComputerTab } from "@/stores/workspace-panel-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DesktopIcon } from "@phosphor-icons/react";

/**
 * A small button that pushes content into the Computer panel and opens it.
 * Use this on documents, tasks, secrets, and code blocks.
 */
export function OpenInComputer({
  tab,
  label = "Open in Computer",
  size = "icon-sm",
  variant = "ghost",
  showLabel = false,
}: {
  tab: Omit<ComputerTab, "id" | "openedAt">;
  label?: string;
  size?: "icon-sm" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary";
  showLabel?: boolean;
}) {
  const openTab = useWorkspacePanelStore((s) => s.openTab);

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={() => openTab(tab)}
      className="shrink-0"
    >
      <DesktopIcon className="size-3.5" />
      {showLabel && <span className="ml-1.5">{label}</span>}
    </Button>
  );

  if (showLabel) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
