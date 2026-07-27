import Link from "next/link"
import {
  FileTextIcon,
  FileCodeIcon,
  FileImageIcon,
  FileIcon,
  FilePdfIcon,
  FileZipIcon,
  DotsThreeVerticalIcon,
  DownloadIcon,
  ShareIcon,
  ClockIcon,
} from "@phosphor-icons/react"
import type { ProjectFile, FileType } from "@prisma/client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { cn } from "@/lib/utils"

type FileWithMetadata = ProjectFile & {
  _count?: {
    versions: number
    shares: number
  }
}

interface FileCardProps {
  file: FileWithMetadata
  projectId: string
  onEdit?: (file: ProjectFile) => void
  onDelete?: (file: ProjectFile) => void
  onDownload?: (file: ProjectFile) => void
  onShare?: (file: ProjectFile) => void
}

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

function getFileTypeBadge(type: FileType) {
  const labels: Record<FileType, string> = {
    artifact: "Artifact",
    document: "Document",
    config: "Config",
    asset: "Asset",
    code: "Code",
    data: "Data",
    other: "Other",
  }
  return labels[type]
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function FileCard({
  file,
  projectId,
  onEdit,
  onDelete,
  onDownload,
  onShare,
}: FileCardProps) {
  const FileIconComponent = getFileIcon(file.type, file.mimeType)
  const fileTypeColor = getFileTypeColor(file.type)

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* File Icon */}
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60",
                fileTypeColor
              )}
            >
              <FileIconComponent className="size-5" weight="fill" />
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Link
                  href={`/dashboard/projects/${projectId}/files/${file.id}`}
                  className="truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {file.name}
                </Link>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {getFileTypeBadge(file.type)}
                </Badge>
              </div>

              <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  <TimeAgo date={file.updatedAt} />
                </span>
                {file._count && file._count.versions > 1 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                    v{file.version}
                  </Badge>
                )}
              </div>

              {file.tags && file.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {file.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="h-4 px-1.5 text-[10px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {file.tags.length > 3 && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      +{file.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="truncate text-xs text-muted-foreground">
                {file.path}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <DotsThreeVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/projects/${projectId}/files/${file.id}`}
                >
                  View Details
                </Link>
              </DropdownMenuItem>
              {onDownload && (
                <DropdownMenuItem onClick={() => onDownload(file)}>
                  <DownloadIcon className="mr-2 size-4" />
                  Download
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={() => onShare(file)}>
                  <ShareIcon className="mr-2 size-4" />
                  Share
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(file)}>
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(file)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
