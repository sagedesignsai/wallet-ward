"use client"

import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import { cn } from "@/lib/utils"
import { CircleNotchIcon, GlobeIcon, TerminalWindowIcon } from "@phosphor-icons/react"

interface SandboxViewProps {
  sandboxId: string
  urlFromTool?: string | null
}

/**
 * Resolve a signed sandbox URL for a port. Tool results carry the canonical
 * URLs (priority); when none has arrived yet, fall back to the same sandbox
 * endpoint the desktop's iframe apps use to refresh signed URLs.
 */
function useSandboxUrl(
  sandboxId: string,
  action: "web-terminal" | "preview",
  urlFromTool?: string | null,
  port?: number
) {
  const [url, setUrl] = useState<string | null>(urlFromTool ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (urlFromTool) setUrl(urlFromTool)
  }, [urlFromTool])

  useEffect(() => {
    if (url || !sandboxId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/agents/sandboxes/${sandboxId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(port ? { port } : {}) }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error?.message ?? "Failed to resolve URL")
        const resolved = (json?.data as { url?: string } | undefined)?.url
        if (resolved) setUrl(resolved)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to resolve URL")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sandboxId, action, url, port, attempt])

  return { url, loading, error, retry: () => setAttempt((a) => a + 1) }
}

function SandboxEmptyState({
  icon: Icon,
  title,
  hint,
  loading,
  error,
  onRetry,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  title: string
  hint: string
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      {loading ? (
        <CircleNotchIcon size={30} className="animate-spin text-slate-600" />
      ) : (
        <Icon size={30} className="text-slate-600" />
      )}
      <p className="text-sm text-slate-500">{loading ? "Resolving URL…" : title}</p>
      <p className={cn("max-w-md text-xs", error ? "text-rose-400" : "text-slate-600")}>
        {error ?? hint}
      </p>
      {error && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 transition-colors hover:bg-slate-800"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function SandboxTerminal({ sandboxId, urlFromTool }: SandboxViewProps) {
  const { url, loading, error, retry } = useSandboxUrl(sandboxId, "web-terminal", urlFromTool)
  return (
    <div className="h-full bg-black">
      {url ? (
        <iframe
          src={url}
          title="Sandbox web terminal"
          sandbox="allow-scripts allow-same-origin"
          allow="clipboard-read; clipboard-write"
          className="h-full w-full border-none"
        />
      ) : (
        <SandboxEmptyState
          icon={TerminalWindowIcon}
          title="No terminal attached yet"
          hint="The sandbox web terminal appears here once the agent provisions a sandbox."
          loading={loading}
          error={error}
          onRetry={retry}
        />
      )}
    </div>
  )
}

export function SandboxPreview({ sandboxId, urlFromTool }: SandboxViewProps) {
  const { url, loading, error, retry } = useSandboxUrl(sandboxId, "preview", urlFromTool, 3000)
  return (
    <div className="h-full bg-white">
      {url ? (
        <iframe
          src={url}
          title="App live preview"
          sandbox="allow-scripts allow-same-origin allow-popups"
          allow="clipboard-read; clipboard-write"
          className="h-full w-full border-none"
        />
      ) : (
        <SandboxEmptyState
          icon={GlobeIcon}
          title="No live preview URL available yet"
          hint="When the agent starts a dev server on port 3000, the signed preview URL appears here."
          loading={loading}
          error={error}
          onRetry={retry}
        />
      )}
    </div>
  )
}
