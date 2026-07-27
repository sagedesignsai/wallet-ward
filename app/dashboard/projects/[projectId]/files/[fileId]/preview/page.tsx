"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileTextIcon,
  FileCodeIcon,
  FileImageIcon,
  FileIcon,
  FilePdfIcon,
  FileZipIcon,
  WarningIcon,
  DownloadIcon,
  ShareIcon,
  ArrowLeftIcon,
  ClockIcon,
} from "@phosphor-icons/react"
import type { FileType } from "@prisma/client"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useFile } from "@/hooks/use-project-files"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { FilePreview } from "@/components/files/file-preview"
import { FileShareDialog } from "@/components/files/file-share-dialog"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getFileIcon(type: FileType, mimeType: string) {
  if (type === "code") return FileCodeIcon
  if (type === "document" || mimeType.includes("pdf")) return FilePdfIcon
  if (type === "asset" || mimeType.includes("image")) return FileImageIcon
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz")
  )
    return FileZipIcon
  if (type === "artifact") return FileZipIcon
  return FileIcon
}

function getFileTypeColor(type: FileType): string {
  switch (type) {
    case "artifact":
      return "text-orange-500"
    case "document":
      return "text-blue-500"
    case "config":
      return "text-purple-500"
    case "asset":
      return "text-pink-500"
    case "code":
      return "text-emerald-500"
    case "data":
      return "text-cyan-500"
    default:
      return "text-muted-foreground"
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/* ------------------------------------------------------------------ */
/*  Page wrapper (unwrap params)                                      */
/* ------------------------------------------------------------------ */

export default function FilePreviewPage({
  params,
}: {
  params: Promise<{ projectId: string; fileId: string }>
}) {
  const { projectId, fileId } = use(params)
  return <FilePreviewInner projectId={projectId} fileId={fileId} />
}

/* ------------------------------------------------------------------ */
/*  Inner component                                                    */
/* ------------------------------------------------------------------ */

function FilePreviewInner({
  projectId,
  fileId,
}: {
  projectId: string
  fileId: string
}) {
  const router = useRouter()
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const { file, isLoading, error } = useFile(projectId, fileId)
  const [shareOpen, setShareOpen] = useState(false)

  /* ---- dashboard config ---- */
  useEffect(() => {
    if (project && file) {
      setConfig({
        title: `${file.name} — Preview`,
        description: "File preview",
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
          { label: "Preview" },
        ],
      })
    }
  }, [project, file, setConfig, projectId, fileId])

  /* ---- handlers ---- */
  const handleDownload = () => {
    if (file?.url) {
      window.open(file.url, "_blank")
    }
  }

  /* ---- loading ---- */
  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[400px] rounded-lg" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  /* ---- error / not found ---- */
  if (error || !file) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {error ? (
              <WarningIcon className="size-4" />
            ) : (
              <FileIcon className="size-4" />
            )}
          </EmptyMedia>
          <EmptyTitle>File not found</EmptyTitle>
          <EmptyDescription>
            {error ?? "This file may have been deleted."}
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

  const FileIconComponent = getFileIcon(file.type, file.mimeType)
  const fileTypeColor = getFileTypeColor(file.type)

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      {/* ---- Back link ---- */}
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href={`/dashboard/projects/${projectId}/files/${fileId}`}>
          <ArrowLeftIcon className="size-3.5" />
          Back to file details
        </Link>
      </Button>

      {/* ---- File header ---- */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted/60",
            fileTypeColor
          )}
        >
          <FileIconComponent className="size-6" weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-foreground">
            {file.name}
          </h1>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {file.type}
            </Badge>
            {file._count && file._count.versions > 1 && (
              <Badge variant="outline" className="text-[10px]">
                v{file.version}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ---- Preview area ---- */}
      <div className="overflow-hidden rounded-lg border border-border/40 bg-card">
        <FilePreview file={file} />
      </div>

      {/* ---- Metadata ---- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Size</Label>
          <div className="text-sm text-foreground">
            {formatFileSize(file.size)}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="text-sm text-foreground">{file.type}</div>
        </div>

        <div className="space-y-1.5">
          <Label>MIME Type</Label>
          <div className="font-mono text-sm text-xs text-foreground">
            {file.mimeType}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Version</Label>
          <div className="text-sm text-foreground">v{file.version}</div>
        </div>

        <div className="space-y-1.5">
          <Label>Path</Label>
          <div className="truncate font-mono text-sm text-xs text-foreground">
            {file.path}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Created</Label>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5 text-muted-foreground" />
            <TimeAgo date={file.createdAt} />
          </div>
        </div>
      </div>

      {/* ---- Tags ---- */}
      {file.tags && file.tags.length > 0 && (
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {file.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ---- Actions ---- */}
      <div className="flex items-center gap-2">
        <Button onClick={handleDownload} disabled={!file.url}>
          <DownloadIcon className="mr-1.5 size-3.5" />
          Download
        </Button>
        <Button variant="outline" onClick={() => setShareOpen(true)}>
          <ShareIcon className="mr-1.5 size-3.5" />
          Share
        </Button>
      </div>

      {/* ---- Share Dialog ---- */}
      <FileShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        fileId={fileId}
        projectId={projectId}
        onShareCreated={() => {
          setShareOpen(false)
        }}
      />
    </div>
  )
}
