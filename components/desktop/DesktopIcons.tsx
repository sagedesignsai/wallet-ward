"use client"

import { useDesktopState } from "@/stores/desktop/desktop-state.store"
import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { useWindowManager } from "@/stores/desktop/window-manager.store"
import { cn } from "@/lib/utils"
import type { DesktopIcon } from "@/stores/desktop/desktop-state.store"

export function DesktopIcons() {
  const icons = useDesktopState((s) => s.icons)
  const getApp = useAppRegistry((s) => s.get)
  const openWindow = useWindowManager((s) => s.openWindow)

  const handleIconDoubleClick = (icon: DesktopIcon) => {
    const app = getApp(icon.appId)
    if (!app) return

    openWindow({
      appId: app.id,
      title: icon.label || app.name,
      width: app.defaultSize.width,
      height: app.defaultSize.height,
      x: app.defaultPosition?.x ?? 100,
      y: app.defaultPosition?.y ?? 100,
      resizable: app.resizable,
      minimizable: app.minimizable,
      maximizable: app.maximizable,
      state: "normal",
    })
  }

  if (icons.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full p-4">
        {icons.map((icon) => {
          const app = getApp(icon.appId)
          if (!app) return null

          return (
            <button
              key={icon.id}
              className={cn(
                "absolute flex flex-col items-center justify-center gap-1",
                "w-20 h-20 rounded-lg p-2 pointer-events-auto",
                "hover:bg-white/10 transition-colors",
                "focus:bg-white/20 focus:outline-none"
              )}
              style={{ left: icon.x, top: icon.y }}
              onDoubleClick={() => handleIconDoubleClick(icon)}
              aria-label={`Open ${icon.label}`}
            >
              {typeof app.icon === "string" ? (
                <span className="text-2xl">{app.icon}</span>
              ) : (
                <app.icon className="size-8" />
              )}
              <span className="text-xs text-white text-center truncate w-full">
                {icon.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
