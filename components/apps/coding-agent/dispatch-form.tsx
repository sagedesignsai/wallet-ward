"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { CircleNotchIcon, CpuIcon, GitBranchIcon, WarningCircleIcon } from "@phosphor-icons/react"

interface ProjectOption {
  id: string
  name: string
  slug?: string
}

interface DispatchFormProps {
  projectId?: string
  provisioning: boolean
  error: string | null
  onStart: (projectId: string, prompt: string) => void
}

export function DispatchForm({ projectId, provisioning, error, onStart }: DispatchFormProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState(projectId ?? "")
  const [prompt, setPrompt] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    let cancelled = false
    setProjectsLoading(true)
    setProjectsError(null)
    fetch("/api/v1/projects")
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error?.message ?? `Request failed: ${res.status}`)
        if (cancelled) return
        const list = Array.isArray(json?.data) ? (json.data as ProjectOption[]) : []
        setProjects(list)
        if (!projectId && list.length > 0) {
          setSelectedId((prev) => prev || list[0].id)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setProjectsError(err instanceof Error ? err.message : "Failed to load projects")
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  const effectiveProjectId = projectId ?? selectedId
  const resolvedName = projects.find((p) => p.id === effectiveProjectId)?.name
  const canStart = Boolean(effectiveProjectId) && !projectsLoading && !provisioning

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!effectiveProjectId || provisioning) return
    onStart(effectiveProjectId, prompt)
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-slate-950 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl"
      >
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
            <CpuIcon size={20} weight="duotone" />
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-white">Coding Agent</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Opens an OpenCode agent in an isolated Daytona sandbox. Watch the live transcript, open
            the terminal, and preview the app as it works.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Project
            </span>
            {projectsLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs text-slate-500">
                <CircleNotchIcon size={13} className="animate-spin" /> Loading projects…
              </div>
            ) : projectsError ? (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-2 text-xs text-rose-300">
                <WarningCircleIcon size={13} className="shrink-0" />
                <span>{projectsError}</span>
              </div>
            ) : projectId ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-2">
                <GitBranchIcon size={14} className="shrink-0 text-slate-400" />
                <span className="min-w-0 truncate text-xs text-slate-300">
                  {resolvedName ?? projectId}
                </span>
              </div>
            ) : projects.length > 0 ? (
              <NativeSelect
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full"
              >
                {projects.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-2 text-xs text-slate-500">
                No projects available. Create a project before starting an agent.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Prompt (optional)
            </span>
            <textarea
              ref={textareaRef}
              rows={2}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value)
                resize()
              }}
              placeholder="e.g. Add a rate limiter to the API routes and write tests…"
              className="max-h-24 min-h-[52px] resize-none rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/30"
            />
          </div>

          <Button
            type="submit"
            disabled={!canStart}
            className="h-9 w-full gap-2 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {provisioning ? (
              <>
                <CircleNotchIcon size={15} className="animate-spin" /> Provisioning sandbox…
              </>
            ) : (
              <>
                <CpuIcon size={15} /> Start session
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-rose-300">
              <WarningCircleIcon size={13} className="mt-px shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-600">
            Sessions run in a disposable cloud sandbox. The agent has shell and file access inside
            it.
          </p>
        </div>
      </form>
    </div>
  )
}
