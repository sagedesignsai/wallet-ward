import Link from "next/link"
import {
  GithubLogoIcon,
  GitlabLogoIcon,
  CodeIcon,
  DotsThreeVerticalIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  ClockIcon,
} from "@phosphor-icons/react"
import type { Repository, RepositoryProvider, RepositorySyncStatus } from "@prisma/client"

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

type RepositoryWithMetadata = Repository & {
  _count?: {
    webhooks: number
  }
}

interface RepositoryCardProps {
  repository: RepositoryWithMetadata
  projectId: string
  onEdit?: (repository: Repository) => void
  onDelete?: (repository: Repository) => void
  onSync?: (repository: Repository) => void
}

function getProviderIcon(provider: RepositoryProvider) {
  switch (provider) {
    case "github":
      return GithubLogoIcon
    case "gitlab":
      return GitlabLogoIcon
    case "bitbucket":
    case "custom":
    default:
      return CodeIcon
  }
}

function getProviderColor(provider: RepositoryProvider): string {
  switch (provider) {
    case "github":
      return "text-gray-900 dark:text-gray-100"
    case "gitlab":
      return "text-orange-500"
    case "bitbucket":
      return "text-blue-500"
    default:
      return "text-muted-foreground"
  }
}

function getSyncStatusBadge(status: RepositorySyncStatus) {
  switch (status) {
    case "synced":
      return (
        <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
          <CheckCircleIcon className="size-3" weight="fill" />
          Synced
        </Badge>
      )
    case "syncing":
      return (
        <Badge variant="outline" className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600">
          <ClockIcon className="size-3" weight="fill" />
          Syncing
        </Badge>
      )
    case "error":
      return (
        <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
          <WarningCircleIcon className="size-3" weight="fill" />
          Error
        </Badge>
      )
    case "never_synced":
      return (
        <Badge variant="outline" className="gap-1">
          <ClockIcon className="size-3" />
          Not synced
        </Badge>
      )
  }
}

export function RepositoryCard({
  repository,
  projectId,
  onEdit,
  onDelete,
  onSync,
}: RepositoryCardProps) {
  const ProviderIcon = getProviderIcon(repository.provider)
  const providerColor = getProviderColor(repository.provider)

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Provider Icon */}
            <div className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60",
              providerColor
            )}>
              <ProviderIcon className="size-5" weight="fill" />
            </div>

            {/* Repository Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/dashboard/projects/${projectId}/repositories/${repository.id}`}
                  className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                >
                  {repository.name}
                </Link>
                {getSyncStatusBadge(repository.syncStatus)}
              </div>

              {repository.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {repository.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CodeIcon className="size-3" />
                  {repository.branch}
                </span>
                {repository.lastSyncAt && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    Synced <TimeAgo date={repository.lastSyncAt} />
                  </span>
                )}
                {repository._count && repository._count.webhooks > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {repository._count.webhooks} webhook{repository._count.webhooks > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              <div className="mt-2">
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate block"
                >
                  {repository.url}
                </a>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <DotsThreeVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${projectId}/repositories/${repository.id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              {onSync && (
                <DropdownMenuItem onClick={() => onSync(repository)}>
                  Sync Repository
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(repository)}>
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(repository)}
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
