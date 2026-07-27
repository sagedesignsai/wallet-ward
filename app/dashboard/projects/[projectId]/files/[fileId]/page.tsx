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
  TrashIcon,
  TagIcon,
  ClockIcon,
  EyeIcon,
  ClockCounterClockwiseIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react"
import type { FileType, FileVisibility } from "@prisma/client"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useFile, useProjectFiles } from "@/hooks/use-project-files"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Helpers (copied from file-card.tsx)                               */
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

const FILE_TYPE_OPTIONS: { value: FileType; label: string }[] = [
  { value: "other", label: "Other" },
  { value: "document", label: "Document" },
  { value: "code", label: "Code" },
  { value: "asset", label: "Asset" },
  { value: "config", label: "Config" },
  { value: "data", label: "Data" },
  { value: "artifact", label: "Artifact" },
]

const VISIBILITY_OPTIONS: { value: FileVisibility; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "project", label: "Project" },
  { value: "public", label: "Public" },
]

/* ------------------------------------------------------------------ */
/*  Page wrapper (unwrap params)                                      */
/* ------------------------------------------------------------------ */

export default function FileDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; fileId: string }>
}) {
  const { projectId, fileId } = use(params)
  return <FileDetailInner projectId={projectId} fileId={fileId} />
}

/* ------------------------------------------------------------------ */
/*  Inner component                                                    */
/* ------------------------------------------------------------------ */

function FileDetailInner({
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
  const { updateFile, deleteFile } = useProjectFiles(projectId)

  /* ---- editable state ---- */
  const [name, setName] = useState("")
  const [type, setType] = useState<FileType>("other")
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<FileVisibility>("private")
  const [dirty, setDirty] = useState(false)
  const [tagInput, setTagInput] = useState("")

  /* ---- sync state when file loads ---- */
  useEffect(() => {
    if (file) {
      setName(file.name)
      setType(file.type)
      setTags(file.tags ?? [])
      setVisibility(file.visibility ?? "private")
      setDirty(false)
    }
  }, [file])

  /* ---- dashboard config ---- */
  useEffect(() => {
    if (project && file) {
      setConfig({
        title: file.name,
        description: "File details",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          { label: project.name, href: `/dashboard/projects/${projectId}` },
          {
            label: "Files",
            href: `/dashboard/projects/${projectId}/files`,
          },
          { label: file.name },
        ],
      })
    }
  }, [project, file, setConfig, projectId])

  /* ---- handlers ---- */
  const markDirty = () => setDirty(true)

  const handleSave = async () => {
    const updated = await updateFile(fileId, {
      name: name.trim(),
      type,
      tags,
      visibility,
    })
    if (updated) {
      setDirty(false)
      toast.success("File updated")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this file? This cannot be undone.")) return
    const ok = await deleteFile(fileId)
    if (ok) {
      toast.success("File deleted")
      router.push(`/dashboard/projects/${projectId}/files`)
    }
  }

  const handleDownload = () => {
    if (file?.url) {
      window.open(file.url, "_blank")
    }
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
      setTagInput("")
      markDirty()
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
    markDirty()
  }

  /* ---- loading ---- */
  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
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
    <div className="flex max-w-3xl flex-col gap-5">
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

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/dashboard/projects/${projectId}/files/${fileId}/preview`}
          >
            <EyeIcon className="mr-1.5 size-3.5" />
            Preview
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/dashboard/projects/${projectId}/files/${fileId}/versions`}
          >
            <ClockCounterClockwiseIcon className="mr-1.5 size-3.5" />
            Versions
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/projects/${projectId}/files/upload`}>
            <UploadSimpleIcon className="mr-1.5 size-3.5" />
            Upload New Version
          </Link>
        </Button>
      </div>

      {/* ---- Info grid ---- */}
      <div className="grid grid-cols-2 gap-4">
        {/* Size (read-only) */}
        <div className="space-y-1.5">
          <Label>Size</Label>
          <div className="text-sm text-foreground">
            {formatFileSize(file.size)}
          </div>
        </div>

        {/* Type (editable) */}
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(v: string) => {
              setType(v as FileType)
              markDirty()
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visibility (editable) */}
        <div className="space-y-1.5">
          <Label>Visibility</Label>
          <Select
            value={visibility}
            onValueChange={(v: string) => {
              setVisibility(v as FileVisibility)
              markDirty()
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Path (read-only) */}
        <div className="space-y-1.5">
          <Label>Path</Label>
          <div className="truncate font-mono text-sm text-foreground">
            {file.path}
          </div>
        </div>

        {/* Created */}
        <div className="space-y-1.5">
          <Label>Created</Label>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5 text-muted-foreground" />
            <TimeAgo date={file.createdAt} />
          </div>
        </div>

        {/* Updated */}
        <div className="space-y-1.5">
          <Label>Updated</Label>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5 text-muted-foreground" />
            <TimeAgo date={file.updatedAt} />
          </div>
        </div>
      </div>

      {/* ---- Tags ---- */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <TagIcon className="size-3.5" />
          Tags
        </Label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No tags</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Add a tag…"
            className="h-7 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addTag}
            disabled={!tagInput.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      {/* ---- Version info ---- */}
      {file._count && (
        <div className="space-y-1 rounded-md border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Version</span>
            <span className="font-medium text-foreground">v{file.version}</span>
          </div>
          {file._count.versions !== undefined && (
            <div className="flex items-center justify-between">
              <span>Total versions</span>
              <span className="font-medium text-foreground">
                {file._count.versions}
              </span>
            </div>
          )}
          {file._count.shares !== undefined && (
            <div className="flex items-center justify-between">
              <span>Shares</span>
              <span className="font-medium text-foreground">
                {file._count.shares}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ---- Actions ---- */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={!dirty || !name.trim()}>
          Save
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={!file.url}>
          <DownloadIcon className="mr-1.5 size-3.5" />
          Download
        </Button>
        <Button
          variant="ghost"
          className="ml-auto gap-1.5 text-red-400 hover:text-red-300"
          onClick={handleDelete}
        >
          <TrashIcon className="size-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}
