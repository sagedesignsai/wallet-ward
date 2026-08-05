"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { WarningIcon, ArrowLeftIcon, ClockIcon } from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useFile } from "@/hooks/use-project-files"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { FileVersionList } from "@/components/files/file-version-list"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FileVersion = {
  id: string
  version: number
  size: number
  name: string
  mimeType: string
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Page wrapper (unwrap params)                                      */
/* ------------------------------------------------------------------ */

export default function FileVersionsPage({
  params,
}: {
  params: Promise<{ projectId: string; fileId: string }>
}) {
  const { projectId, fileId } = use(params)
  return <FileVersionsInner projectId={projectId} fileId={fileId} />
}

/* ------------------------------------------------------------------ */
/*  Inner component                                                    */
/* ------------------------------------------------------------------ */

function FileVersionsInner({
  projectId,
  fileId,
}: {
  projectId: string
  fileId: string
}) {
  const { project } = useProject(projectId)
  const {
    file,
    isLoading: fileLoading,
    error: fileError,
  } = useFile(projectId, fileId)

  const [versions, setVersions] = useState<FileVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<FileVersion | null>(null)

  /* ---- dashboard config ---- */
  if (project && file) {
    useDashboardConfigStore.setState({
      title: `${file.name} — Versions`,
      description: "Version history for this file",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        { label: project.name, href: `/dashboard/projects/${projectId}` },
        {
          label: "Files",
          href: `/dashboard/projects/${projectId}/files`,
        },
        {
          label: file.name,
          href: `/dashboard/projects/${projectId}/files/${fileId}`,
        },
        { label: "Versions" },
      ],
    })
  }

  /* ---- fetch versions ---- */
  useEffect(() => {
    if (!projectId || !fileId) return

    let cancelled = false

    async function fetchVersions() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/files/${fileId}/versions`,
          { credentials: "include" }
        )

        if (!res.ok) {
          throw new Error(`Failed to load versions (${res.status})`)
        }

        const body = await res.json()
        if (!cancelled) {
          setVersions(body.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load versions."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchVersions()
    return () => {
      cancelled = true
    }
  }, [projectId, fileId])

  /* ---- restore handler ---- */
  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId)

    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/files/${fileId}/restore/${versionId}`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Failed to restore version")
      }

      toast.success("Version restored successfully")

      // Re-fetch versions
      const versionsRes = await fetch(
        `/api/v1/projects/${projectId}/files/${fileId}/versions`,
        { credentials: "include" }
      )
      if (versionsRes.ok) {
        const body = await versionsRes.json()
        setVersions(body.data ?? [])
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to restore version"
      toast.error(message)
    } finally {
      setRestoringId(null)
      setConfirmRestore(null)
    }
  }

  const handleRequestRestore = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    if (version) setConfirmRestore(version)
  }

  const handleConfirmRestore = () => {
    if (confirmRestore) {
      handleRestore(confirmRestore.id)
    }
  }

  /* ---- loading ---- */
  if (fileLoading || (isLoading && !error)) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    )
  }

  /* ---- error / not found ---- */
  if (fileError || !file) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {fileError ? (
              <WarningIcon className="size-4" />
            ) : (
              <ClockIcon className="size-4" />
            )}
          </EmptyMedia>
          <EmptyTitle>File not found</EmptyTitle>
          <EmptyDescription>
            {fileError ?? "This file may have been deleted."}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href={`/dashboard/projects/${projectId}/files`}>
            Back to Files
          </Link>
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {/* ---- Back link ---- */}
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href={`/dashboard/projects/${projectId}/files/${fileId}`}>
          <ArrowLeftIcon className="size-3.5" />
          Back to file details
        </Link>
      </Button>

      {/* ---- Error banner ---- */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* ---- Versions list ---- */}
      {!isLoading && versions.length === 0 && !error && (
        <Empty className="rounded-lg border border-border/40 bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClockIcon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No version history</EmptyTitle>
            <EmptyDescription>
              This file has only one version. Versions will appear here as the
              file is updated.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && versions.length > 0 && (
        <FileVersionList
          versions={versions}
          currentVersion={file.version}
          onRestore={handleRequestRestore}
          restoringId={restoringId}
        />
      )}

      {/* ---- Confirm Restore Dialog ---- */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="mx-4 w-full max-w-sm space-y-4 rounded-xl bg-popover p-4 ring-1 ring-foreground/10">
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-medium">
                Restore Version?
              </h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to restore version{" "}
                {confirmRestore.version}? This will create a new version with
                the content from this version.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmRestore(null)}
                disabled={restoringId !== null}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRestore}
                disabled={restoringId !== null}
              >
                {restoringId ? "Restoring..." : "Restore"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
