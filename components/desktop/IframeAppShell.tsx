"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import type { DesktopWindow } from "@/types/desktop/window"
import type { AppManifest } from "@/types/desktop/app"
import { useWindowManager } from "@/stores/desktop/window-manager.store"

export interface IframeAppShellProps {
  window: DesktopWindow
  app: AppManifest
}

export function IframeAppShell({ window, app }: IframeAppShellProps) {
  const updateWindowUrl = useWindowManager((s) => s.updateWindowUrl)
  const [iframeKey, setIframeKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(app.expiry ?? 0)
  const startedAtRef = useRef(Date.now())

  const src = typeof app.url === "function" ? app.url(window.content) : app.url
  const sandboxName = (window.content as { sandboxName?: string }).sandboxName
  const hasUsableUrl = typeof src === "string" && src.length > 0
  const resolvingRef = useRef(false)

  // Signed-URL countdown (tick every 10s)
  useEffect(() => {
    if (!app.expiry) return
    startedAtRef.current = Date.now()
    setTimeRemaining(app.expiry)
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setTimeRemaining(Math.max(0, (app.expiry as number) - elapsed))
    }, 10000)
    return () => clearInterval(interval)
  }, [app.expiry])

  // Refresh the signed URL when it expires
  useEffect(() => {
    if (timeRemaining > 0 || !app.expiry || !app.onRefresh) return
    let cancelled = false
    app.onRefresh(window.id).then(({ url, token }) => {
      if (cancelled) return
      startedAtRef.current = Date.now()
      setTimeRemaining(app.expiry as number)
      updateWindowUrl(window.id, url, token)
      setLoaded(false)
      setError(false)
      setIframeKey((k) => k + 1)
    })
    return () => {
      cancelled = true
    }
  }, [timeRemaining, app.expiry, app.onRefresh, window.id, updateWindowUrl])

  // Re-resolve a signed URL that was stripped during persistence (rehydrate)
  const resolveUrl = useCallback(async () => {
    if (!app.onRefresh || resolvingRef.current) return
    resolvingRef.current = true
    setError(false)
    try {
      const { url, token } = await app.onRefresh(window.id)
      updateWindowUrl(window.id, url, token)
      setLoaded(false)
      setError(false)
      setIframeKey((k) => k + 1)
    } catch {
      setError(true)
    } finally {
      resolvingRef.current = false
    }
  }, [app.onRefresh, window.id, updateWindowUrl])

  // Only auto-resolve when the URL is absent (stripped by rehydrate); never
  // re-trigger once a usable URL has arrived.
  useEffect(() => {
    if (hasUsableUrl || !app.onRefresh) return
    resolveUrl()
  }, [hasUsableUrl, app.onRefresh, resolveUrl])

  const handleRetry = useCallback(() => {
    setError(false)
    setLoaded(false)
    if (!hasUsableUrl && app.onRefresh) {
      resolveUrl()
    } else {
      setIframeKey((k) => k + 1)
    }
  }, [hasUsableUrl, app.onRefresh, resolveUrl])

  return (
    <div className="relative flex h-full flex-col">
      {/* Sandbox header bar (signed URLs only) */}
      {app.expiry && (
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-1.5">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-2 rounded-full",
                timeRemaining <= 0
                  ? "bg-red-500"
                  : timeRemaining < 300
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              )}
            />
            <span className="text-xs font-medium text-foreground">{app.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {sandboxName && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {sandboxName}
              </span>
            )}
            {timeRemaining < 300 && timeRemaining > 0 && (
              <span className="text-[10px] text-amber-400">
                · {Math.floor(timeRemaining / 60)}m left
              </span>
            )}
            {timeRemaining <= 0 && (
              <span className="text-[10px] text-destructive">· expired</span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 bg-zinc-950">
        {/* Open in new tab */}
        <button
          onClick={() => globalThis.open(src, "_blank")}
          className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded bg-background/80 text-muted-foreground hover:text-foreground"
          aria-label="Open in new tab"
          title="Open in new tab"
        >
          <ArrowSquareOutIcon className="size-3.5" />
        </button>

        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs text-muted-foreground">Connecting...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Failed to load content</p>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </div>
        )}
        {src ? (
          <iframe
            key={iframeKey}
            src={src}
            className={`h-full w-full border-0 ${loaded ? "" : "invisible"}`}
            title={window.title}
            sandbox={app.sandbox}
            allow={app.allow}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        ) : app.onRefresh ? null : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No URL provided
          </div>
        )}
      </div>
    </div>
  )
}
