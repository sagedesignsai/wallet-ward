/**
 * Desktop State Store
 * Manages desktop-level state (wallpaper, icons, settings)
 */

import { create } from "zustand"

export interface DesktopIcon {
  id: string
  appId: string
  x: number
  y: number
  label: string
}

export interface DesktopSettings {
  wallpaper: string
  wallpaperColor?: string
  iconSize: "small" | "medium" | "large"
  iconGrid: boolean
  showTaskbar: boolean
  taskbarPosition: "bottom" | "top" | "left" | "right"
  taskbarAutoHide: boolean
  animationsEnabled: boolean
}

interface DesktopStateStore {
  /** Desktop icons (pinned apps) */
  icons: DesktopIcon[]

  /** Desktop settings */
  settings: DesktopSettings

  /** App launcher open state */
  appLauncherOpen: boolean

  /** Context menu state */
  contextMenu: {
    open: boolean
    x: number
    y: number
    items: ContextMenuItem[]
  } | null

  // Actions
  addIcon: (icon: Omit<DesktopIcon, "id">) => void
  removeIcon: (iconId: string) => void
  updateIcon: (iconId: string, updates: Partial<DesktopIcon>) => void
  moveIcon: (iconId: string, x: number, y: number) => void

  updateSettings: (updates: Partial<DesktopSettings>) => void

  openAppLauncher: () => void
  closeAppLauncher: () => void
  toggleAppLauncher: () => void

  openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void
  closeContextMenu: () => void
}

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  onClick?: () => void
  submenu?: ContextMenuItem[]
}

export const DEFAULT_SETTINGS: DesktopSettings = {
  wallpaper: "gradient",
  wallpaperColor: "#0f172a",
  iconSize: "medium",
  iconGrid: true,
  showTaskbar: true,
  taskbarPosition: "bottom",
  taskbarAutoHide: false,
  animationsEnabled: true,
}

export const useDesktopState = create<DesktopStateStore>()((set, get) => ({
  icons: [],
  settings: DEFAULT_SETTINGS,
  appLauncherOpen: false,
  contextMenu: null,

      addIcon: (icon) => {
        const id = `icon-${Date.now()}`
        set((s) => ({
          icons: [...s.icons, { ...icon, id }],
        }))
      },

      removeIcon: (iconId) => {
        set((s) => ({
          icons: s.icons.filter((i) => i.id !== iconId),
        }))
      },

      updateIcon: (iconId, updates) => {
        set((s) => ({
          icons: s.icons.map((i) =>
            i.id === iconId ? { ...i, ...updates } : i
          ),
        }))
      },

      moveIcon: (iconId, x, y) => {
        set((s) => ({
          icons: s.icons.map((i) =>
            i.id === iconId ? { ...i, x, y } : i
          ),
        }))
      },

      updateSettings: (updates) => {
        set((s) => ({
          settings: { ...s.settings, ...updates },
        }))
      },

      openAppLauncher: () => set({ appLauncherOpen: true }),
      closeAppLauncher: () => set({ appLauncherOpen: false }),
      toggleAppLauncher: () =>
        set((s) => ({ appLauncherOpen: !s.appLauncherOpen })),

      openContextMenu: (x, y, items) => {
        set({
          contextMenu: { open: true, x, y, items },
        })
      },

      closeContextMenu: () => {
        set({ contextMenu: null })
      },
    })
)
