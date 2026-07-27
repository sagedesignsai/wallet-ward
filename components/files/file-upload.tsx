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
import { cn } from "@/lib/utils"

interface FileUploadValues {
  file: File | null
  name: string
  type: FileType
  tags: string[]
  visibility: FileVisibility
}

interface FileUploadProps {
  onSubmit: (values: FileUploadValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  uploadProgress?: number | null
}

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
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/"))
    return FileIcon
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

export function FileUpload({
  onSubmit,
  onCancel,
  isSubmitting = false,
  uploadProgress = null,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<FileType>("other")
  const [tagsInput, setTagsInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<FileVisibility>("private")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile)
      // Auto-fill name from filename (strip extension)
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "")
      setName((prev) => prev || baseName)
      // Auto-detect type from MIME
      setType(getFileTypeFromMime(selectedFile.type))
      if (errors.file) {
        setErrors((prev) => ({ ...prev, file: "" }))
      }
    },
    [errors.file]
  )

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
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect]
  )

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setName("")
    setType("other")
    setTags([])
    setTagsInput("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleTagsKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        const newTag = tagsInput.trim().toLowerCase().replace(/,/g, "")
        if (newTag && !tags.includes(newTag)) {
          setTags((prev) => [...prev, newTag])
          setTagsInput("")
          if (errors.tags) {
            setErrors((prev) => ({ ...prev, tags: "" }))
          }
        }
      } else if (e.key === "Backspace" && !tagsInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1))
      }
    },
    [tagsInput, tags, errors.tags]
  )

  const handleTagsBlur = useCallback(() => {
    const newTag = tagsInput.trim().toLowerCase().replace(/,/g, "")
    if (newTag && !tags.includes(newTag)) {
      setTags((prev) => [...prev, newTag])
      setTagsInput("")
    }
  }, [tagsInput, tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }, [])

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!file) {
      newErrors.file = "Please select a file to upload"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [file])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return

      await onSubmit({
        file,
        name: name.trim() || file!.name,
        type,
        tags,
        visibility,
      })
    },
    [file, name, type, tags, visibility, validate, onSubmit]
  )

  const IconComponent = file ? getFileIconFromMime(file.type) : UploadSimpleIcon
  const typeColor = getFileTypeColor(type)
  const VisIcon = getVisibilityIcon(visibility)

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* File Drop Zone */}
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
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/20",
              errors.file && "border-destructive/50"
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
                Any file type up to 50 MB
              </p>
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          onChange={handleInputChange}
          disabled={isSubmitting}
          tabIndex={-1}
        />

        {errors.file && (
          <p className="text-xs text-destructive">{errors.file}</p>
        )}
      </div>

      {/* Name */}
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
        <p className="text-[0.625rem] text-muted-foreground">
          A friendly name for this file in the project
        </p>
      </div>

      {/* Type */}
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

      {/* Tags */}
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
                onClick={() => removeTag(tag)}
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
              tags.length === 0 ? "Type and press Enter to add tags..." : ""
            }
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onKeyDown={handleTagsKeyDown}
            onBlur={handleTagsBlur}
            disabled={isSubmitting}
            className="min-w-[120px] flex-1 bg-transparent text-xs/relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
        <p className="text-[0.625rem] text-muted-foreground">
          Press Enter or comma to add a tag
        </p>
      </div>

      {/* Visibility */}
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

      {/* Upload Progress */}
      {isSubmitting && uploadProgress !== null && (
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between text-[0.625rem]">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="font-medium text-muted-foreground">
              {uploadProgress}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <WarningCircleIcon className="size-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{errors.general}</p>
        </div>
      )}

      {/* Actions */}
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
              Uploading...
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
