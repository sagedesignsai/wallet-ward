/**
 * Window Manager Store
 * Manages window positioning, z-index, state, and lifecycle
 */

import { create } from "zustand"
import { nanoid } from "nanoid"
import type { DesktopWindow, WindowManagerStore, WindowState } from "@/types/desktop/window"
import type { WindowContent } from "@/types/desktop/content"
import { useAppRegistry } from "./app-registry.store"

const DEFAULT_WINDOW_WIDTH = 800
const DEFAULT_WINDOW_HEIGHT = 600
const CASCADE_OFFSET = 30

/**
 * Content types whose windows carry signed URLs/tokens that must never be
 * persisted. Used as a fallback when the app registry isn't populated yet.
 */
const IFRAME_APP_IDS = new Set<WindowContent["type"]>(["preview", "desktop", "web-terminal"])

/**
 * Strip signed URL/token fields from an iframe window before persistence.
 * Keeps geometry, zIndex, state, appId, title, and non-secret content.
 */
export function sanitizeWindowForStorage(w: DesktopWindow): DesktopWindow {
  const app = useAppRegistry.getState().get(w.appId)
  const isIframe = app?.kind === "iframe" || IFRAME_APP_IDS.has(w.content.type)
  if (!isIframe) return w
  const content = w.content as unknown as Record<string, unknown>
  const { url: _contentUrl, token: _contentToken, ...restContent } = content
  const { url: _windowUrl, ...restWindow } = w
  return { ...restWindow, content: restContent } as unknown as DesktopWindow
}

export const useWindowManager = create<WindowManagerStore>()(
  (set, get) => ({
  windows: [],
  focusedWindowId: null,
  maxZIndex: 0,

  openWindow: (config) => {
    const state = get()

    // Dedupe: single-instance apps focus the existing window instead of opening a new one
    const app = useAppRegistry.getState().get(config.appId)
    if (app?.singleInstance) {
      const existing = state.windows.find((w) => w.appId === config.appId)
      if (existing) {
        get().focusWindow(existing.id)
        return existing.id
      }
    }

    // Dedupe: apps with a dedupeKey reuse windows whose content matches
    if (app?.dedupeKey && config.content) {
      const key = app.dedupeKey(config.content)
      if (key) {
        const existing = state.windows.find(
          (w) => w.appId === config.appId && app.dedupeKey?.(w.content) === key
        )
        if (existing) {
          get().focusWindow(existing.id)
          return existing.id
        }
      }
    }

    const windowId = nanoid()

    // Auto-position if no position provided
    const x = config.x ?? (state.windows.length * CASCADE_OFFSET) % 300
    const y = config.y ?? (state.windows.length * CASCADE_OFFSET) % 200

    const newWindow: DesktopWindow = {
      id: windowId,
      appId: config.appId,
      title: config.title,
      x,
      y,
      width: config.width ?? DEFAULT_WINDOW_WIDTH,
      height: config.height ?? DEFAULT_WINDOW_HEIGHT,
      zIndex: state.maxZIndex + 1,
      state: config.state ?? "normal",
      content: config.content ?? ({} as WindowContent),
      resizable: config.resizable ?? true,
      minimizable: config.minimizable ?? true,
      maximizable: config.maximizable ?? true,
      openedAt: new Date().toISOString(),
    }

    set({
      windows: [...state.windows, newWindow],
      focusedWindowId: windowId,
      maxZIndex: state.maxZIndex + 1,
    })

    return windowId
  },

  closeWindow: (windowId) => {
    const state = get()
    const windows = state.windows.filter((w) => w.id !== windowId)
    const focusedWindowId =
      state.focusedWindowId === windowId
        ? windows[windows.length - 1]?.id ?? null
        : state.focusedWindowId

    set({ windows, focusedWindowId })
  },

  focusWindow: (windowId) => {
    const state = get()
    const window = state.windows.find((w) => w.id === windowId)
    if (!window) return

    // Bring to front
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === windowId ? { ...w, zIndex: s.maxZIndex + 1 } : w
      ),
      focusedWindowId: windowId,
      maxZIndex: s.maxZIndex + 1,
    }))
  },

  updateWindow: (windowId, updates) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === windowId ? { ...w, ...updates } : w
      ),
    }))
  },

  minimizeWindow: (windowId) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === windowId ? { ...w, state: "minimized" as WindowState } : w
      ),
    }))
  },

  maximizeWindow: (windowId) => {
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== windowId) return w
        return {
          ...w,
          state: "maximized" as WindowState,
          previousDimensions: {
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
          },
        }
      }),
    }))
  },

  restoreWindow: (windowId) => {
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== windowId) return w
        const previous = w.previousDimensions
        return {
          ...w,
          state: "normal" as WindowState,
          x: previous?.x ?? w.x,
          y: previous?.y ?? w.y,
          width: previous?.width ?? w.width,
          height: previous?.height ?? w.height,
          previousDimensions: undefined,
        }
      }),
    }))
  },

  bringToFront: (windowId) => {
    set((s) => {
      const window = s.windows.find((w) => w.id === windowId)
      if (!window) return s

      return {
        windows: s.windows.map((w) =>
          w.id === windowId ? { ...w, zIndex: s.maxZIndex + 1 } : w
        ),
        maxZIndex: s.maxZIndex + 1,
      }
    })
  },

  getWindow: (windowId) => {
    return get().windows.find((w) => w.id === windowId)
  },

  appendTerminalLines: (windowId, lines) => {
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== windowId || w.content.type !== "terminal") return w
        return {
          ...w,
          content: {
            ...w.content,
            lines: [...w.content.lines, ...lines],
          },
        }
      }),
    }))
  },

  updateWindowUrl: (windowId, url, token) => {
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== windowId) return w
        const content = w.content as WindowContent & { url?: string; token?: string }
        return {
          ...w,
          url,
          content: "url" in content
            ? {
                ...content,
                url,
                ...(token !== undefined ? { token } : {}),
              }
            : content,
        }
      }),
    }))
  },
  })
)

/**
 * Window Manager Service
 * Helper methods for common window operations
 */
export class WindowManagerService {
  static cascade() {
    const { windows, updateWindow } = useWindowManager.getState()
    let x = 20
    let y = 20

    windows
      .filter((w) => w.state === "normal")
      .forEach((w) => {
        updateWindow(w.id, { x, y })
        x += CASCADE_OFFSET
        y += CASCADE_OFFSET
      })
  }

  static minimizeAll() {
    const { windows, minimizeWindow } = useWindowManager.getState()
    windows.forEach((w) => minimizeWindow(w.id))
  }

  static restoreAll() {
    const { windows, restoreWindow } = useWindowManager.getState()
    windows.forEach((w) => restoreWindow(w.id))
  }

  static closeAll() {
    const { windows, closeWindow } = useWindowManager.getState()
    windows.forEach((w) => closeWindow(w.id))
  }

  static getVisibleWindows() {
    const { windows } = useWindowManager.getState()
    return windows.filter((w) => w.state !== "minimized")
  }

  static getMinimizedWindows() {
    const { windows } = useWindowManager.getState()
    return windows.filter((w) => w.state === "minimized")
  }

  static getWindowBounds(windowId: string) {
    const window = useWindowManager.getState().getWindow(windowId)
    if (!window) return null

    return {
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
    }
  }
}
