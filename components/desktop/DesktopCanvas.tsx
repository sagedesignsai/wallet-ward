"use client"

import { useWindowManager } from "@/stores/desktop/window-manager.store"
import { useDesktopState } from "@/stores/desktop/desktop-state.store"
import { WindowFrame } from "./WindowFrame"
import { DesktopTaskbar } from "./DesktopTaskbar"
import { DesktopIcons } from "./DesktopIcons"
import { DesktopContextMenu } from "./DesktopContextMenu"
import { AppLauncher } from "./AppLauncher"
import { cn } from "@/lib/utils"

export interface DesktopCanvasProps {
  className?: string
}

export function DesktopCanvas({ className }: DesktopCanvasProps) {
  const windows = useWindowManager((s) => s.windows)
  const settings = useDesktopState((s) => s.settings)
  const contextMenu = useDesktopState((s) => s.contextMenu)
  const closeContextMenu = useDesktopState((s) => s.closeContextMenu)

  // Sort windows by z-index (lower first, so higher z-index renders on top)
  const sortedWindows = [...windows].sort((a, b) => a.zIndex - b.zIndex)

  // Filter out minimized windows
  const visibleWindows = sortedWindows.filter((w) => w.state !== "minimized")

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      onClick={closeContextMenu}
    >
      {/* Desktop background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        style={{
          backgroundColor: settings.wallpaperColor,
        }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Desktop icons */}
      <DesktopIcons />

      {/* Floating windows */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleWindows.map((window) => (
          <WindowFrame key={window.id} window={window} />
        ))}
      </div>

      {/* Taskbar */}
      {settings.showTaskbar && <DesktopTaskbar />}

      {/* App launcher */}
      <AppLauncher />

      {/* Context menu */}
      {contextMenu?.open && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
        />
      )}
    </div>
  )
}
