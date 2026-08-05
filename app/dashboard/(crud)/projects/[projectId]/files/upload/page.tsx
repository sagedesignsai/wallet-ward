"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import { WarningIcon } from "@phosphor-icons/react"
import type { FileType, FileVisibility } from "@prisma/client"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { FileUpload } from "@/components/files/file-upload"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/*  Page wrapper (unwrap params)                                      */
/* ------------------------------------------------------------------ */

export default function FileUploadPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  return <FileUploadInner projectId={projectId} />
}

/* ------------------------------------------------------------------ */
/*  Inner component                                                    */
/* ------------------------------------------------------------------ */

function FileUploadInner({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { setConfig } = useDashboardConfig()
  const { project, isLoading: projectLoading } = useProject(projectId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---- dashboard config ---- */
  useEffect(() => {
    setConfig({
      title: "Upload File",
      description: "Upload a new file to this project",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/dashboard/projects" },
        {
          label: project?.name ?? "Project",
          href: `/dashboard/projects/${projectId}`,
        },
        {
          label: "Files",
          href: `/dashboard/projects/${projectId}/files`,
        },
        { label: "Upload" },
      ],
    })
  }, [project, setConfig, projectId])

  /* ---- handlers ---- */
  const handleSubmit = async (values: {
    file: File | null
    name: string
    type: FileType
    tags: string[]
    visibility: FileVisibility
  }) => {
    if (!values.file) return

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", values.file)
      formData.append("name", values.name)
      formData.append("type", values.type)
      formData.append("tags", values.tags.join(","))
      formData.append("visibility", values.visibility)

      const res = await fetch(`/api/v1/projects/${projectId}/files/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Upload failed")
      }

      toast.success("File uploaded successfully")
      router.push(`/dashboard/projects/${projectId}/files`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/projects/${projectId}/files`)
  }

  /* ---- loading (project still loading) ---- */
  if (projectLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <WarningIcon className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload form */}
      <FileUpload
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
