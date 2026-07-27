import { ArrowClockwiseIcon, CheckIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimeAgo } from "@/components/dashboard/time-ago"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

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

interface FileVersionListProps {
  versions: FileVersion[]
  currentVersion: number
  onRestore: (versionId: string) => void
  restoringId?: string | null
}

/* ------------------------------------------------------------------ */
/*  FileVersionList                                                    */
/* ------------------------------------------------------------------ */

export function FileVersionList({
  versions,
  currentVersion,
  onRestore,
  restoringId = null,
}: FileVersionListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        <span className="text-xs font-medium text-foreground">
          Version History
        </span>
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
          {versions.length} {versions.length === 1 ? "version" : "versions"}
        </Badge>
      </div>

      {/* Version rows */}
      <div className="divide-y divide-border/40">
        {versions.map((version) => {
          const isCurrent = version.version === currentVersion
          const isRestoring = restoringId === version.id

          return (
            <div
              key={version.id}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              {/* Version number */}
              <div className="flex min-w-[80px] items-center gap-2">
                {isCurrent ? (
                  <Badge
                    variant="default"
                    className="h-4 gap-1 px-1.5 text-[10px]"
                  >
                    <CheckIcon className="size-2.5" />
                    Current
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                    v{version.version}
                  </Badge>
                )}
              </div>

              {/* Version info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-foreground">
                    v{version.version}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    &middot;
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(version.size)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  <TimeAgo date={version.createdAt} className="text-[10px]" />
                </div>
              </div>

              {/* Actions */}
              {!isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(version.id)}
                  disabled={restoringId !== null}
                  className="shrink-0"
                >
                  {isRestoring ? (
                    <>
                      <span className="inline-block size-3 animate-spin rounded-full border border-current border-t-transparent" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <ArrowClockwiseIcon className="mr-1 size-3.5" />
                      Restore
                    </>
                  )}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
