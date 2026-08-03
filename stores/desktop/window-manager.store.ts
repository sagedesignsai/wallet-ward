/**
 * Window Manager Store
 * Manages window positioning, z-index, state, and lifecycle
 */

import { create } from "zustand"
import { nanoid } from "nanoid"
import type { DesktopWindow, WindowManagerStore, WindowState } from "@/types/desktop/window"

const DEFAULT_WINDOW_WIDTH = 800
const DEFAULT_WINDOW_HEIGHT = 600
const CASCADE_OFFSET = 30

export const useWindowManager = create<WindowManagerStore>((set, get) => ({
  windows: [],
  focusedWindowId: null,
  maxZIndex: 0,

  openWindow: (config) => {
    const state = get()
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
      content: config.content ?? {},
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
}))

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
