"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import {
  FileIcon,
  UploadIcon,
  XIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { SecretFormProps } from "./types"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}

export function FileForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialValues,
}: SecretFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [fileContent, setFileContent] = useState(initialValues?.value ?? "")
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!fileContent) {
      newErrors.file = "Please upload a file"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, fileContent])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      await onSubmit({
        name: name.trim(),
        value: fileContent,
        description: description.trim() || undefined,
        type: "file",
        metadata: {
          fileName,
          fileSize,
          encoding: "base64",
        },
      })
    },
    [name, fileContent, fileName, fileSize, description, validate, onSubmit]
  )

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]

      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({
          ...prev,
          file: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`,
        }))
        return
      }

      try {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          const base64Content = base64.split(",")[1] || base64
          setFileContent(base64Content)
          setFileName(file.name)
          setFileSize(file.size)
          if (errors.file) {
            setErrors((prev) => ({ ...prev, file: "" }))
          }
        }
        reader.onerror = () => {
          setErrors((prev) => ({
            ...prev,
            file: "Failed to read file",
          }))
        }
        reader.readAsDataURL(file)
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          file: err instanceof Error ? err.message : "Failed to read file",
        }))
      }
    },
    [errors.file]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  })

  const handleClearFile = useCallback(() => {
    setFileContent("")
    setFileName("")
    setFileSize(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20 px-3 py-2">
        <p className="text-xs text-slate-900 dark:text-slate-100">
          <FileIcon className="inline size-3 mr-1" />
          Store binary files, images, documents, or any file type securely. Files
          are base64 encoded. Max size: {formatFileSize(MAX_FILE_SIZE)}.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="file-name"
          placeholder="e.g., logo, certificate_file, credentials"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }))
            }
          }}
          autoFocus
          className="font-mono"
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file-upload">
          File <span className="text-destructive">*</span>
        </Label>

        {!fileName ? (
          <div
            {...getRootProps()}
            className={cn(
              "rounded-lg border-2 border-dashed bg-muted/20 p-6 text-center transition-all cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5"
                : errors.file
                  ? "border-destructive"
                  : "border-border/60 hover:border-border"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadIcon className="size-5" />
              </div>
              <div>
                {isDragActive ? (
                  <>
                    <p className="text-sm font-medium text-primary">
                      Drop your file here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Release to upload
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      Drag & drop a file here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to select a file
                    </p>
                  </>
                )}
                <p className="text-[0.625rem] text-muted-foreground mt-1">
                  Any file type, up to {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileSize)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleClearFile}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove file"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {errors.file && (
          <p className="text-xs text-destructive">{errors.file}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="file-description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="file-description"
          placeholder="What is this file? How should it be used?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="resize-none text-xs"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating...
            </>
          ) : (
            "Create File Secret"
          )}
        </Button>
      </div>
    </form>
  )
}
