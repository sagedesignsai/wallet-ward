"use client"

import { Rnd } from "react-rnd"
import { useWindowManager } from "@/stores/desktop/window-manager.store"
import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { cn } from "@/lib/utils"
import { XIcon, MinusIcon, SquareIcon } from "@phosphor-icons/react"
import { useCallback, useState } from "react"
import type { DesktopWindow, WindowState } from "@/types/desktop/window"

export interface WindowFrameProps {
  window: DesktopWindow
}

export function WindowFrame({ window }: WindowFrameProps) {
  const { updateWindow, closeWindow, focusWindow, minimizeWindow, maximizeWindow, restoreWindow } =
    useWindowManager()
  const appManifest = useAppRegistry((s) => s.get(window.appId))
  const [isDragging, setIsDragging] = useState(false)

  if (!appManifest) return null

  const AppComponent = appManifest.component

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    focusWindow(window.id)
  }, [window.id, focusWindow])

  const handleDragStop = useCallback(
    (e: any, d: { x: number; y: number }) => {
      setIsDragging(false)
      updateWindow(window.id, { x: d.x, y: d.y })
    },
    [window.id, updateWindow]
  )

  const handleResizeStop = useCallback(
    (e: any, direction: string, ref: HTMLElement, delta: any, position: { x: number; y: number }) => {
      updateWindow(window.id, {
        x: position.x,
        y: position.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      })
    },
    [window.id, updateWindow]
  )

  const handleClose = useCallback(() => {
    closeWindow(window.id)
  }, [window.id, closeWindow])

  const handleMinimize = useCallback(() => {
    minimizeWindow(window.id)
  }, [window.id, minimizeWindow])

  const handleMaximize = useCallback(() => {
    if (window.state === "maximized") {
      restoreWindow(window.id)
    } else {
      maximizeWindow(window.id)
    }
  }, [window.id, window.state, maximizeWindow, restoreWindow])

  const handleTitleBarClick = useCallback(() => {
    focusWindow(window.id)
  }, [window.id, focusWindow])

  const isMaximized = window.state === "maximized"

  return (
    <Rnd
      position={{ x: window.x, y: window.y }}
      size={{ width: window.width, height: window.height }}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{ zIndex: window.zIndex }}
      disableDragging={isMaximized}
      enableResizing={window.resizable && !isMaximized}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="window-title-bar"
    >
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleTitleBarClick}
      >
        {/* Title bar */}
        <div className="window-title-bar flex h-9 cursor-grab items-center justify-between border-b bg-muted/60 px-3 select-none">
          <div className="flex items-center gap-2 min-w-0">
            {typeof appManifest.icon === "string" ? (
              <span className="text-xs">{appManifest.icon}</span>
            ) : (
              <appManifest.icon className="size-4 shrink-0" />
            )}
            <span className="truncate text-xs font-medium">{window.title}</span>
          </div>

          <div className="flex items-center gap-0.5">
            {window.minimizable && (
              <button
                onClick={handleMinimize}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Minimize"
              >
                <MinusIcon className="size-3.5" />
              </button>
            )}
            {window.maximizable && (
              <button
                onClick={handleMaximize}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={isMaximized ? "Restore" : "Maximize"}
              >
                <SquareIcon className="size-3" weight={isMaximized ? "fill" : "regular"} />
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Close"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AppComponent
            windowId={window.id}
            content={window.content}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
          />
        </div>
      </div>
    </Rnd>
  )
}
