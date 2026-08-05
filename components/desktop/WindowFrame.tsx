"use client"

import { Rnd, type RndDragCallback, type RndResizeCallback } from "react-rnd"
import { useWindowManager } from "@/stores/desktop/window-manager.store"
import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { cn } from "@/lib/utils"
import { XIcon, MinusIcon, SquareIcon } from "@phosphor-icons/react"
import { useCallback, useState } from "react"
import type { DesktopWindow } from "@/types/desktop/window"
import { IframeAppShell } from "./IframeAppShell"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useDesktopState } from "@/stores/desktop/desktop-state.store"

export interface WindowFrameProps {
  window: DesktopWindow
}

export function WindowFrame({ window }: WindowFrameProps) {
  const { updateWindow, closeWindow, focusWindow, minimizeWindow, maximizeWindow, restoreWindow } =
    useWindowManager()
  const appManifest = useAppRegistry((s) => s.get(window.appId))
  const showTaskbar = useDesktopState((s) => s.settings.showTaskbar)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Below the canvas-mode breakpoint the window fills the canvas, so drag/resize
  // are disabled and it renders full-screen (accounting for the bottom taskbar).
  const isMobile = useMediaQuery("(max-width: 1023px)")

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    focusWindow(window.id)
  }, [window.id, focusWindow])

  const handleDragStop: RndDragCallback = useCallback(
    (e, d) => {
      setIsDragging(false)
      updateWindow(window.id, { x: d.x, y: d.y })
    },
    [window.id, updateWindow]
  )

  const handleResizeStart = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleResizeStop: RndResizeCallback = useCallback(
    (e, direction, ref, delta, position) => {
      setIsResizing(false)
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

  const titleBarButtonClass = cn(
    "flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground",
    isMobile ? "size-10" : "size-6"
  )

  if (!appManifest) return null

  const AppComponent = appManifest.component
  const isIframe = appManifest.kind === "iframe"

  return (
    <Rnd
      className="pointer-events-auto"
      position={isMobile || isMaximized ? { x: 0, y: 0 } : { x: window.x, y: window.y }}
      size={
        isMobile || isMaximized
          ? {
              width: "100%",
              height: showTaskbar ? "calc(100% - 48px)" : "100%",
            }
          : { width: window.width, height: window.height }
      }
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      style={{ zIndex: window.zIndex }}
      disableDragging={isMobile || isMaximized}
      enableResizing={window.resizable && !isMaximized && !isMobile}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="window-title-bar"
    >
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden bg-background shadow-xl",
          isMobile ? "rounded-none" : "rounded-lg border border-border",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleTitleBarClick}
      >
        {/* Title bar */}
        <div
          className={cn(
            "window-title-bar flex items-center justify-between border-b bg-muted/60 px-3 select-none",
            isMobile ? "h-11 cursor-default" : "h-9 cursor-grab"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {typeof appManifest.icon === "string" ? (
              <span className="text-xs">{appManifest.icon}</span>
            ) : (
              <appManifest.icon className="size-4 shrink-0" />
            )}
            <span className="truncate text-xs font-medium">{window.title}</span>
          </div>

          <div
            className="flex items-center gap-0.5"
            onMouseDown={(e) => {
              focusWindow(window.id)
              e.stopPropagation()
            }}
          >
            {window.minimizable && (
              <button
                onClick={handleMinimize}
                className={cn(titleBarButtonClass, "hover:text-foreground")}
                aria-label="Minimize"
              >
                <MinusIcon className="size-3.5" />
              </button>
            )}
            {window.maximizable && !isMobile && (
              <button
                onClick={handleMaximize}
                className={titleBarButtonClass}
                aria-label={isMaximized ? "Restore" : "Maximize"}
              >
                <SquareIcon className="size-3" weight={isMaximized ? "fill" : "regular"} />
              </button>
            )}
            {window.closable !== false && (
              <button
                onClick={handleClose}
                className={cn(
                  titleBarButtonClass,
                  "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                )}
                aria-label="Close"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "flex-1 overflow-hidden",
            (isDragging || isResizing) && "pointer-events-none"
          )}
        >
          {isIframe ? (
            <IframeAppShell window={window} app={appManifest} />
          ) : AppComponent ? (
            <AppComponent
              windowId={window.id}
              content={window.content}
              onClose={handleClose}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
            />
          ) : null}
        </div>
      </div>
    </Rnd>
  )
}
