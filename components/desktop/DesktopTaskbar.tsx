"use client"

import { useWindowManager } from "@/stores/desktop/window-manager.store"
import { useDesktopState } from "@/stores/desktop/desktop-state.store"
import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DotsThreeIcon, PushPinIcon } from "@phosphor-icons/react"
import { useState, useEffect } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

export function DesktopTaskbar() {
  const windows = useWindowManager((s) => s.windows)
  const focusedWindowId = useWindowManager((s) => s.focusedWindowId)
  const focusWindow = useWindowManager((s) => s.focusWindow)
  const restoreWindow = useWindowManager((s) => s.restoreWindow)
  const getApp = useAppRegistry((s) => s.get)
  const toggleAppLauncher = useDesktopState((s) => s.toggleAppLauncher)
  const settings = useDesktopState((s) => s.settings)
  const [time, setTime] = useState(new Date())

  // Below the canvas-mode breakpoint the taskbar becomes a simple switcher:
  // bottom-aligned regardless of the user's position setting, tray hidden.
  const isMobile = useMediaQuery("(max-width: 1023px)")

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleWindowClick = (windowId: string, state: string) => {
    if (state === "minimized") {
      restoreWindow(windowId)
    }
    focusWindow(windowId)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const position = isMobile
    ? "bottom-0"
    : settings.taskbarPosition === "top"
      ? "top-0"
      : settings.taskbarPosition === "left"
        ? "left-0 top-0 h-full w-12 flex-col"
        : settings.taskbarPosition === "right"
          ? "right-0 top-0 h-full w-12 flex-col"
          : "bottom-0"

  return (
    <div
      className={cn(
        "absolute left-0 right-0 flex h-12 items-center justify-between border-t border-border/40 bg-background/95 backdrop-blur-sm px-2 z-[9999]",
        position
      )}
    >
      {/* App launcher button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleAppLauncher}
        className="shrink-0"
        aria-label="Open app launcher"
      >
        <DotsThreeIcon className="size-5" weight="bold" />
      </Button>

      {/* Running apps */}
      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto px-2">
        {windows.map((window) => {
          const app = getApp(window.appId)
          if (!app) return null

          // Pinned or non-closable windows get a pin glyph (and no close affordance)
          const isPinned =
            window.pinned === true ||
            window.closable === false ||
            app.closable === false
          const isActive = focusedWindowId === window.id

          return (
            <Button
              key={window.id}
              variant="ghost"
              size="sm"
              onClick={() => handleWindowClick(window.id, window.state)}
              className={cn(
                "gap-1.5 min-w-0",
                isMobile
                  ? "h-9 shrink-0 max-w-[160px] px-2.5"
                  : "h-8 px-2 max-w-[150px]",
                window.state === "minimized" && "opacity-50",
                isActive && "bg-muted text-foreground"
              )}
            >
              {typeof app.icon === "string" ? (
                <span className="text-xs">{app.icon}</span>
              ) : (
                <app.icon className="size-4 shrink-0" />
              )}
              <span className="truncate text-xs">{window.title}</span>
              {isPinned && (
                <PushPinIcon
                  className="size-3 shrink-0 text-primary"
                  weight="fill"
                  aria-label="Pinned"
                />
              )}
            </Button>
          )
        })}
      </div>

      {/* System tray (hidden on mobile to keep the switcher clean) */}
      {!isMobile && (
        <div className="flex items-center gap-2 px-2 shrink-0">
          <div className="flex flex-col items-end text-xs">
            <span className="font-medium">{formatTime(time)}</span>
            <span className="text-muted-foreground text-[10px]">{formatDate(time)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
