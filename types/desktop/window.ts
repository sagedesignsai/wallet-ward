/**
 * Desktop Window Types
 * Core types for the window management system
 */

import type { ReactNode } from "react"

export type WindowState = "normal" | "minimized" | "maximized"

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowDimensions {
  width: number
  height: number
}

export interface DesktopWindow {
  /** Unique window ID */
  id: string

  /** Which app this window is running */
  appId: string

  /** Window title (shown in title bar) */
  title: string

  /** Position on desktop canvas */
  x: number
  y: number

  /** Dimensions */
  width: number
  height: number

  /** Stacking order (higher = on top) */
  zIndex: number

  /** Window state */
  state: WindowState

  /** Previous dimensions (for restore from maximized) */
  previousDimensions?: {
    x: number
    y: number
    width: number
    height: number
  }

  /** App-specific content payload */
  content: Record<string, unknown>

  /** Can this window be resized? */
  resizable?: boolean

  /** Can this window be minimized? */
  minimizable?: boolean

  /** Can this window be maximized? */
  maximizable?: boolean

  /** ISO timestamp when window was opened */
  openedAt: string
}

export interface WindowManagerStore {
  /** All open windows */
  windows: DesktopWindow[]

  /** Currently focused window ID */
  focusedWindowId: string | null

  /** Highest z-index currently in use */
  maxZIndex: number

  // Actions
  openWindow: (config: Omit<DesktopWindow, "id" | "zIndex" | "openedAt">) => string
  closeWindow: (windowId: string) => void
  focusWindow: (windowId: string) => void
  updateWindow: (windowId: string, updates: Partial<DesktopWindow>) => void
  minimizeWindow: (windowId: string) => void
  maximizeWindow: (windowId: string) => void
  restoreWindow: (windowId: string) => void
  bringToFront: (windowId: string) => void
  getWindow: (windowId: string) => DesktopWindow | undefined
}
