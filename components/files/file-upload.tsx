"use client"

import { useState, useCallback, useRef } from "react"
import {
  UploadSimpleIcon,
  XIcon,
  FileTextIcon,
  FileCodeIcon,
  FileImageIcon,
  FileIcon,
  FilePdfIcon,
  FileZipIcon,
  TagIcon,
  LockIcon,
  WarningCircleIcon,
  GlobeIcon,
  FolderIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react"
import type { FileType, FileVisibility } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiErrorMessage, cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileUploadValues {
  file: File | null
  name: string
  path: string
  type: FileType
  tags: string[]
  visibility: FileVisibility
}

interface FileUploadProps {
  projectId: string
  onSuccess: (fileId: string) => void
  onCancel: () => void
  /** Optional parent file ID when uploading a new version */
  parentId?: string
}

// ─── Upload stages for progress UI ───────────────────────────────────────────

type UploadStage =
  | "idle"
  | "presigning" // requesting presigned URL from server
  | "uploading" // PUT-ing bytes to R2
  | "confirming" // writing DB record
  | "done"
  | "error"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILE_TYPES: { value: FileType; label: string }[] = [
  { value: "artifact", label: "Artifact" },
  { value: "document", label: "Document" },
  { value: "config", label: "Config" },
  { value: "asset", label: "Asset" },
  { value: "code", label: "Code" },
  { value: "data", label: "Data" },
  { value: "other", label: "Other" },
]

const FILE_VISIBILITY: { value: FileVisibility; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "project", label: "Project" },
  { value: "public", label: "Public" },
]

function getFileIconFromMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImageIcon
  if (mimeType === "application/pdf") return FilePdfIcon
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz") ||
    mimeType.includes("compressed")
  )
    return FileZipIcon
  if (
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("xml") ||
    mimeType.includes("yaml")
  )
    return FileCodeIcon
  if (mimeType.startsWith("text/")) return FileTextIcon
  return FileIcon
}

function getFileTypeFromMime(mimeType: string): FileType {
  if (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/")
  )
    return "asset"
  if (mimeType === "application/pdf") return "document"
  if (
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("xml") ||
    mimeType.includes("yaml") ||
    mimeType.includes("html") ||
    mimeType.includes("css")
  )
    return "code"
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz")
  )
    return "artifact"
  if (
    mimeType.includes("csv") ||
    mimeType.includes("excel") ||
    mimeType.includes("sheet") ||
    mimeType.includes("sql")
  )
    return "data"
  if (mimeType.startsWith("text/")) return "document"
  return "other"
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

function getVisibilityIcon(visibility: FileVisibility): typeof LockIcon {
  switch (visibility) {
    case "private":
      return LockIcon
    case "project":
      return FolderIcon
    case "public":
    default:
      return GlobeIcon
  }
}

function stageLabel(stage: UploadStage): string {
  switch (stage) {
    case "presigning":
      return "Preparing upload…"
    case "uploading":
      return "Uploading to storage…"
    case "confirming":
      return "Saving file record…"
    case "done":
      return "Upload complete!"
    default:
      return "Uploading…"
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileUpload({
  projectId,
  onSuccess,
  onCancel,
  parentId,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [path, setPath] = useState("")
  const [type, setType] = useState<FileType>("other")
  const [tagsInput, setTagsInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<FileVisibility>("private")

  const [stage, setStage] = useState<UploadStage>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isSubmitting = stage !== "idle" && stage !== "error"

  // ── File selection ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setName((prev) => prev || selectedFile.name.replace(/\.[^/.]+$/, ""))
    setPath((prev) => prev || `/${selectedFile.name}`)
    setType(getFileTypeFromMime(selectedFile.type))
    setErrorMessage(null)
  }, [])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setName("")
    setPath("")
    setType("other")
    setTags([])
    setTagsInput("")
    setStage("idle")
    setUploadProgress(0)
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFileSelect(droppedFile)
    },
    [handleFileSelect]
  )

  // ── Tags ──────────────────────────────────────────────────────────────────

  const commitTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/,/g, "")
    if (tag) setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]))
    setTagsInput("")
  }, [])

  const handleTagsKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        commitTag(tagsInput)
      } else if (e.key === "Backspace" && !tagsInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1))
      }
    },
    [tagsInput, tags.length, commitTag]
  )

  // ── Two-step presigned upload ─────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!file) return

      setErrorMessage(null)
      setUploadProgress(0)

      try {
        // ── Step 1: Request presigned URL from server ──────────────────────
        setStage("presigning")

        const presignRes = await fetch(
          `/api/v1/projects/${projectId}/files/presign`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
            }),
          }
        )

        if (!presignRes.ok) {
          const body = await presignRes.json().catch(() => null)
          throw new Error(apiErrorMessage(body, "Failed to get upload URL"))
        }

        const { data: presignData } = await presignRes.json()
        const { uploadUrl, storageKey } = presignData

        // ── Step 2: PUT file bytes directly to R2 ─────────────────────────
        setStage("uploading")

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener("progress", (ev) => {
            if (ev.lengthComputable) {
              setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
            }
          })

          xhr.addEventListener("load", () => {
            // R2 returns 200 for presigned PUTs
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(
                new Error(
                  `Storage upload failed (HTTP ${xhr.status}). Check R2 credentials and CORS settings.`
                )
              )
            }
          })

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload. Please try again."))
          })

          xhr.open("PUT", uploadUrl)
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
          )
          xhr.send(file)
        })

        setUploadProgress(100)

        // ── Step 3: Confirm upload — server writes DB record ───────────────
        setStage("confirming")

        const confirmRes = await fetch(
          `/api/v1/projects/${projectId}/files/confirm`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storageKey,
              name: name.trim() || file.name,
              path: path.startsWith("/") ? path : `/${path}`,
              type,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              tags,
              visibility,
              ...(parentId ? { parentId } : {}),
            }),
          }
        )

        if (!confirmRes.ok) {
          const body = await confirmRes.json().catch(() => null)
          throw new Error(apiErrorMessage(body, "Failed to save file record"))
        }

        const { data: confirmedFile } = await confirmRes.json()

        setStage("done")
        onSuccess(confirmedFile.id)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Upload failed. Please try again."
        setErrorMessage(message)
        setStage("error")
        setUploadProgress(0)
      }
    },
    [file, projectId, name, path, type, tags, visibility, parentId, onSuccess]
  )

  // ── Render ────────────────────────────────────────────────────────────────

  const IconComponent = file ? getFileIconFromMime(file.type) : UploadSimpleIcon
  const typeColor = getFileTypeColor(type)
  const VisIcon = getVisibilityIcon(visibility)

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* ── File drop zone ── */}
      <div className="grid gap-2">
        <Label>
          File <span className="text-destructive">*</span>
        </Label>

        {file ? (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60",
                  typeColor
                )}
              >
                <IconComponent className="size-5" weight="fill" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {file.name}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[0.625rem] text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  <span>·</span>
                  <span>{file.type || "Unknown type"}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                aria-label="Remove file"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors",
                isDragging
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <UploadSimpleIcon className="size-5" weight="bold" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground">
                {isDragging
                  ? "Drop file here"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                Any file type — uploads directly to storage
              </p>
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFileSelect(f)
          }}
          disabled={isSubmitting}
          tabIndex={-1}
        />
      </div>

      {/* ── Display name ── */}
      <div className="grid gap-2">
        <Label htmlFor="file-name">
          Display Name{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="file-name"
          placeholder={file ? file.name : "Auto-filled from filename"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* ── Virtual path ── */}
      <div className="grid gap-2">
        <Label htmlFor="file-path">
          Path{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="file-path"
          placeholder="/documents/report.pdf"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          disabled={isSubmitting}
          className="font-mono text-xs"
        />
        <p className="text-[0.625rem] text-muted-foreground">
          Virtual path for folder browsing. Prefix with a directory to organise
          files, e.g. <code>/assets/images/</code>
        </p>
      </div>

      {/* ── Type ── */}
      <div className="grid gap-2">
        <Label>
          Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={type}
          onValueChange={(v: string) => setType(v as FileType)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILE_TYPES.map((ft) => (
              <SelectItem key={ft.value} value={ft.value}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block size-1.5 rounded-full",
                      ft.value === "artifact" && "bg-orange-500",
                      ft.value === "document" && "bg-blue-500",
                      ft.value === "config" && "bg-purple-500",
                      ft.value === "asset" && "bg-pink-500",
                      ft.value === "code" && "bg-emerald-500",
                      ft.value === "data" && "bg-cyan-500",
                      ft.value === "other" && "bg-muted-foreground/50"
                    )}
                  />
                  {ft.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Tags ── */}
      <div className="grid gap-2">
        <Label htmlFor="file-tags">
          Tags{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-input/20 px-2 py-1 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-5 gap-1 px-1.5 text-[0.625rem]"
            >
              <TagIcon className="size-2.5" />
              {tag}
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
                disabled={isSubmitting}
              >
                <XIcon className="size-2.5" />
              </button>
            </Badge>
          ))}
          <input
            id="file-tags"
            type="text"
            placeholder={
              tags.length === 0 ? "Type and press Enter to add tags…" : ""
            }
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onKeyDown={handleTagsKeyDown}
            onBlur={() => commitTag(tagsInput)}
            disabled={isSubmitting}
            className="min-w-[120px] flex-1 bg-transparent text-xs/relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
        <p className="text-[0.625rem] text-muted-foreground">
          Press Enter or comma to add a tag
        </p>
      </div>

      {/* ── Visibility ── */}
      <div className="grid gap-2">
        <Label>
          Visibility <span className="text-destructive">*</span>
        </Label>
        <Select
          value={visibility}
          onValueChange={(v: string) => setVisibility(v as FileVisibility)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILE_VISIBILITY.map((vis) => {
              const VisItemIcon = getVisibilityIcon(vis.value)
              return (
                <SelectItem key={vis.value} value={vis.value}>
                  <span className="flex items-center gap-2">
                    <VisItemIcon className="size-3.5" />
                    {vis.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 text-[0.625rem] text-muted-foreground">
          <VisIcon className="size-3" />
          <span>
            {visibility === "private" && "Only you can access this file"}
            {visibility === "project" &&
              "All project members can access this file"}
            {visibility === "public" &&
              "Anyone with the link can access this file"}
          </span>
        </div>
      </div>

      {/* ── Upload progress ── */}
      {isSubmitting && (
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between text-[0.625rem]">
            <span className="flex items-center gap-1 text-muted-foreground">
              {stage === "done" ? (
                <CheckCircleIcon
                  className="size-3 text-emerald-500"
                  weight="fill"
                />
              ) : (
                <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {stageLabel(stage)}
            </span>
            {stage === "uploading" && (
              <span className="font-medium text-muted-foreground">
                {uploadProgress}%
              </span>
            )}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300 ease-out",
                stage === "done" ? "bg-emerald-500" : "bg-primary"
              )}
              style={{
                width:
                  stage === "presigning"
                    ? "10%"
                    : stage === "uploading"
                      ? `${uploadProgress}%`
                      : stage === "confirming"
                        ? "95%"
                        : stage === "done"
                          ? "100%"
                          : "0%",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <WarningCircleIcon className="size-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !file}>
          {isSubmitting ? (
            <>
              <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {stageLabel(stage)}
            </>
          ) : (
            <>
              <UploadSimpleIcon className="size-3.5" weight="bold" />
              Upload File
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
