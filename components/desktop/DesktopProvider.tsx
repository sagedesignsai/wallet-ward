"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { registerSystemApps } from "@/lib/desktop/system-apps"
import {
  useWindowManager,
  sanitizeWindowForStorage,
} from "@/stores/desktop/window-manager.store"
import {
  useDesktopState,
  DEFAULT_SETTINGS,
  type DesktopIcon,
  type DesktopSettings,
} from "@/stores/desktop/desktop-state.store"
import type { DesktopWindow } from "@/types/desktop/window"

const SAVE_DEBOUNCE_MS = 800
const CACHE_PREFIX = "flowspace:desktop"

type PersistedDesktop = {
  windows: DesktopWindow[]
  desktop: { icons: unknown[]; settings: unknown }
}

function cacheKey(projectId: string, part: "windows" | "desktop") {
  return `${CACHE_PREFIX}:${projectId}:${part}`
}

function loadCache(projectId: string): PersistedDesktop | null {
  try {
    const windows = localStorage.getItem(cacheKey(projectId, "windows"))
    const desktop = localStorage.getItem(cacheKey(projectId, "desktop"))
    if (!windows || !desktop) return null
    return {
      windows: JSON.parse(windows) as DesktopWindow[],
      desktop: JSON.parse(desktop) as PersistedDesktop["desktop"],
    }
  } catch {
    return null
  }
}

function writeCache(projectId: string, data: PersistedDesktop) {
  try {
    localStorage.setItem(cacheKey(projectId, "windows"), JSON.stringify(data.windows))
    localStorage.setItem(cacheKey(projectId, "desktop"), JSON.stringify(data.desktop))
  } catch {
    // ignore quota/security errors
  }
}

function maxZIndex(windows: DesktopWindow[]) {
  return windows.reduce((max, w) => Math.max(max, w.zIndex ?? 0), 0)
}

export function DesktopProvider({
  projectId,
  children,
}: {
  projectId?: string
  children: React.ReactNode
}) {
  const [initialized, setInitialized] = useState(false)

  // Increments on every project switch; stale debounced saves abort.
  const epochRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydratingRef = useRef(false)
  const versionRef = useRef(1)
  const lastSavedRef = useRef("")
  const scopeRef = useRef(projectId ?? null)
  scopeRef.current = projectId ?? null

  useEffect(() => {
    registerSystemApps()
    setInitialized(true)
  }, [])

  const snapshot = useCallback((): PersistedDesktop => {
    const wm = useWindowManager.getState()
    const ds = useDesktopState.getState()
    return {
      windows: wm.windows.map(sanitizeWindowForStorage),
      desktop: { icons: ds.icons, settings: ds.settings },
    }
  }, [])

  const persist = useCallback(
    async (project: string, data: PersistedDesktop, version: number) => {
      writeCache(project, data)
      try {
        const res = await fetch(`/api/v1/projects/${project}/desktop`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            windows: data.windows,
            desktop: data.desktop,
            version,
          }),
        })
        if (res.status === 409) {
          // Server changed underneath us — refetch and let the server win.
          const get = await fetch(`/api/v1/projects/${project}/desktop`)
          if (get.ok) {
            const payload = await get.json()
            const server = payload.data
            hydratingRef.current = true
            useWindowManager.setState((s) => ({
              windows: server.windows ?? [],
              focusedWindowId: null,
              maxZIndex: maxZIndex(server.windows ?? []),
            }))
            useDesktopState.setState((s) => ({
              icons: server.desktop?.icons ?? [],
              settings: { ...DEFAULT_SETTINGS, ...(server.desktop?.settings ?? {}) },
            }))
            hydratingRef.current = false
            versionRef.current = server.version ?? 1
            const serverData: PersistedDesktop = {
              windows: server.windows ?? [],
              desktop: server.desktop ?? { icons: [], settings: DEFAULT_SETTINGS },
            }
            writeCache(project, serverData)
            lastSavedRef.current = JSON.stringify(serverData)
          }
          return
        }
        if (res.ok) {
          const payload = await res.json()
          versionRef.current = payload.data?.version ?? version + 1
        }
      } catch {
        // Offline — cache already written; retry on next change.
      }
    },
    []
  )

  const queueSave = useCallback(() => {
    if (hydratingRef.current) return
    const project = scopeRef.current
    if (!project) return
    const epoch = epochRef.current
    const data = snapshot()
    const key = JSON.stringify(data)
    if (key === lastSavedRef.current) return
    lastSavedRef.current = key
    const version = versionRef.current
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (epoch !== epochRef.current) return // project switched
      void persist(project, data, version)
    }, SAVE_DEBOUNCE_MS)
  }, [snapshot, persist])

  // Synchronously flush any pending save (unmount / pagehide). Best-effort:
  // fires a keepalive PUT so the last change isn't lost.
  const flushPendingSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const project = scopeRef.current
    if (!project) return
    const data = snapshot()
    const key = JSON.stringify(data)
    if (key === lastSavedRef.current) return
    lastSavedRef.current = key
    writeCache(project, data)
    void fetch(`/api/v1/projects/${project}/desktop`, {
      method: "PUT",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        windows: data.windows,
        desktop: data.desktop,
        version: versionRef.current,
      }),
    })
  }, [snapshot])

  // Subscribe to store changes → debounced save
  useEffect(() => {
    const unsubWm = useWindowManager.subscribe(() => queueSave())
    const unsubDs = useDesktopState.subscribe(() => queueSave())
    return () => {
      unsubWm()
      unsubDs()
      // Unmount may drop a pending debounced save (e.g. mobile chat/canvas tab switch)
      flushPendingSave()
    }
  }, [queueSave, flushPendingSave])

  // Hydrate on mount / project switch
  useEffect(() => {
    if (!initialized) return
    const project = scopeRef.current
    const epoch = ++epochRef.current
    lastSavedRef.current = ""

    // 1. Paint local cache for instant paint
    const cached = project ? loadCache(project) : null
    hydratingRef.current = true
    if (cached) {
      useWindowManager.setState((s) => ({
        windows: cached.windows,
        focusedWindowId: null,
        maxZIndex: maxZIndex(cached.windows),
      }))
      useDesktopState.setState((s) => ({
        icons: (cached.desktop.icons ?? []) as DesktopIcon[],
        settings: {
          ...DEFAULT_SETTINGS,
          ...((cached.desktop.settings ?? {}) as Partial<DesktopSettings>),
        },
      }))
    } else {
      useWindowManager.setState((s) => ({
        windows: [],
        focusedWindowId: null,
        maxZIndex: 0,
      }))
      useDesktopState.setState((s) => ({ icons: [], settings: DEFAULT_SETTINGS }))
    }
    hydratingRef.current = false

    // 2. Fetch server — server wins
    if (!project) return
    void (async () => {
      try {
        const res = await fetch(`/api/v1/projects/${project}/desktop`)
        if (!res.ok) return
        const payload = await res.json()
        const server = payload.data
        if (epoch !== epochRef.current) return // switched during fetch
        hydratingRef.current = true
        useWindowManager.setState((s) => ({
          windows: server.windows ?? [],
          focusedWindowId: null,
          maxZIndex: maxZIndex(server.windows ?? []),
        }))
        useDesktopState.setState((s) => ({
          icons: server.desktop?.icons ?? [],
          settings: { ...DEFAULT_SETTINGS, ...(server.desktop?.settings ?? {}) },
        }))
        hydratingRef.current = false
        versionRef.current = server.version ?? 1
        const data: PersistedDesktop = {
          windows: server.windows ?? [],
          desktop: server.desktop ?? { icons: [], settings: DEFAULT_SETTINGS },
        }
        writeCache(project, data)
        lastSavedRef.current = JSON.stringify(data)
      } catch {
        // offline — keep the cache paint
      }
    })()
  }, [initialized, projectId])

  // Flush pending save on unload
  useEffect(() => {
    const onHide = () => flushPendingSave()
    window.addEventListener("pagehide", onHide)
    return () => window.removeEventListener("pagehide", onHide)
  }, [flushPendingSave])

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground">Initializing desktop...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}