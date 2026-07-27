import {
  FileTextIcon,
  FileCodeIcon,
  FileImageIcon,
  FileIcon,
  FilePdfIcon,
  FileZipIcon,
  DownloadIcon,
} from "@phosphor-icons/react"
import type { ProjectFile, FileType } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
/*  FilePreview                                                        */
/* ------------------------------------------------------------------ */

interface FilePreviewProps {
  file: ProjectFile
}

export function FilePreview({ file }: FilePreviewProps) {
  const FileIconComponent = getFileIcon(file.type, file.mimeType)
  const fileTypeColor = getFileTypeColor(file.type)

  /* ---- Image preview ---- */
  if (file.mimeType.startsWith("image/") && file.url) {
    return (
      <div className="flex items-center justify-center bg-muted/30 p-6 min-h-[300px]">
        <img
          src={file.url}
          alt={file.name}
          className="max-h-[500px] w-auto rounded-md object-contain"
        />
      </div>
    )
  }

  /* ---- PDF preview ---- */
  if (file.mimeType === "application/pdf" && file.url) {
    return (
      <div className="flex flex-col items-center justify-center bg-muted/30 p-8 min-h-[300px] gap-4">
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl bg-muted/60",
            fileTypeColor
          )}
        >
          <FilePdfIcon className="size-8" weight="fill" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            PDF Document &middot; {formatFileSize(file.size)}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <DownloadIcon className="size-3.5 mr-1.5" />
            Open PDF
          </a>
        </Button>
      </div>
    )
  }

  /* ---- Code preview (placeholder with syntax-highlighting style) ---- */
  if (file.type === "code") {
    return (
      <div className="bg-muted/30 min-h-[300px]">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5", fileTypeColor)}>
              <FileCodeIcon className="size-4" weight="fill" />
              <span className="text-xs font-medium text-foreground">
                {file.name}
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {file.mimeType}
            </Badge>
          </div>
          {file.url && (
            <Button variant="ghost" size="icon-sm" asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <DownloadIcon className="size-3.5" />
              </a>
            </Button>
          )}
        </div>
        <div className="p-4 font-mono text-xs text-muted-foreground leading-relaxed">
          {file.url ? (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View source code
            </a>
          ) : (
            <span>Code content not available for preview</span>
          )}
        </div>
      </div>
    )
  }

  /* ---- Default fallback (icon + metadata) ---- */
  return (
    <div className="flex flex-col items-center justify-center bg-muted/30 p-8 min-h-[300px] gap-4">
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-2xl bg-muted/60",
          fileTypeColor
        )}
      >
        <FileIconComponent className="size-8" weight="fill" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {file.type} &middot; {file.mimeType} &middot;{" "}
          {formatFileSize(file.size)}
        </p>
      </div>
      {file.url && (
        <Button variant="outline" size="sm" asChild>
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <DownloadIcon className="size-3.5 mr-1.5" />
            Download
          </a>
        </Button>
      )}
    </div>
  )
}
