"use client"

import { useAppRegistry } from "@/stores/desktop/app-registry.store"
import { useWindowManager } from "@/stores/desktop/window-manager.store"
import { useDesktopState } from "@/stores/desktop/desktop-state.store"
import { cn } from "@/lib/utils"
import { XIcon } from "@phosphor-icons/react"
import { useCallback, useMemo, useState } from "react"

export function AppLauncher() {
  const appsMap = useAppRegistry((s) => s.apps)
  const apps = useMemo(() => Array.from(appsMap.values()), [appsMap])
  const openWindow = useWindowManager((s) => s.openWindow)
  const appLauncherOpen = useDesktopState((s) => s.appLauncherOpen)
  const closeAppLauncher = useDesktopState((s) => s.closeAppLauncher)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredApps = apps.filter(
    (app) => !app.hidden && app.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAppClick = useCallback(
    (appId: string) => {
      const app = apps.find((a) => a.id === appId)
      if (!app) return

      openWindow({
        appId: app.id,
        title: app.name,
        width: app.defaultSize.width,
        height: app.defaultSize.height,
        x: app.defaultPosition?.x ?? 100,
        y: app.defaultPosition?.y ?? 100,
        resizable: app.resizable,
        minimizable: app.minimizable,
        maximizable: app.maximizable,
        state: "normal",
      })

      closeAppLauncher()
    },
    [apps, openWindow, closeAppLauncher]
  )

  if (!appLauncherOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={closeAppLauncher}
      />

      {/* Launcher panel */}
      <div className="fixed left-1/2 top-1/2 z-[9999] w-[500px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Search bar */}
        <div className="flex items-center border-b border-border px-4">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            onClick={closeAppLauncher}
            className="shrink-0 rounded p-1 hover:bg-muted"
            aria-label="Close app launcher"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* App grid */}
        <div className="max-h-[400px] overflow-y-auto p-4">
          {filteredApps.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No apps found
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg p-3",
                    "hover:bg-muted transition-colors",
                    "focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  )}
                  aria-label={`Launch ${app.name}`}
                >
                  {typeof app.icon === "string" ? (
                    <span className="text-3xl">{app.icon}</span>
                  ) : (
                    <app.icon className="size-10" />
                  )}
                  <span className="text-xs text-center line-clamp-2">{app.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          {filteredApps.length} app{filteredApps.length !== 1 ? "s" : ""} available
        </div>
      </div>
    </>
  )
}
