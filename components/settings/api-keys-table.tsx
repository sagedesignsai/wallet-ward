"use client"

import { useState, useCallback } from "react"
import {
  PlusIcon,
  KeyIcon,
  WarningIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { useApiKeys } from "@/hooks/use-api-keys"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { CopyButton } from "@/components/dashboard/copy-button"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { CreateApiKeyDialog } from "@/components/settings/create-api-key-dialog"
import { cn } from "@/lib/utils"

export function ApiKeysTable() {
  const { keys, isLoading, error, deleteKey, toggleKey } = useApiKeys()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = useCallback(
    async (keyId: string) => {
      setDeletingId(keyId)
      const ok = await deleteKey(keyId)
      setDeletingId(null)

      if (ok) {
        toast.success("API key deleted")
      } else {
        toast.error("Failed to delete API key")
      }
    },
    [deleteKey]
  )

  const handleToggle = useCallback(
    async (keyId: string, enabled: boolean) => {
      setTogglingId(keyId)
      const ok = await toggleKey(keyId, enabled)
      setTogglingId(null)

      if (!ok) {
        toast.error("Failed to update API key")
      }
    },
    [toggleKey]
  )

  return (
    <Card className="gap-0">
      <CardHeader className="border-b border-border/40 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">API Keys</CardTitle>
            <CardDescription>
              Manage API keys for programmatic access
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusIcon className="size-3" />
            Create Key
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Newly created key banner */}
        {newlyCreatedKey && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2">
              <WarningIcon className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">
                  Copy your API key now — it won&apos;t be shown again
                </p>
                <div className="flex items-center gap-2 rounded-md bg-background/80 p-2 border border-border/40">
                  <code className="flex-1 truncate text-[0.65rem] font-mono text-foreground">
                    {newlyCreatedKey}
                  </code>
                  <CopyButton value={newlyCreatedKey} />
                </div>
              </div>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="mt-2 text-[0.65rem] text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/40 p-3"
              >
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <div className="flex-1" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : keys.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KeyIcon className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No API keys</EmptyTitle>
              <EmptyDescription>
                Create an API key to access Wallet Ward programmatically
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="size-3" />
                Create your first key
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Last Used
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Requests
                  </TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((apiKey) => (
                  <TableRow
                    key={apiKey.id}
                    className={cn(
                      !apiKey.enabled && "opacity-60"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <KeyIcon className="size-3 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[150px]">
                          {apiKey.name || "Unnamed key"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-[0.65rem] font-mono text-muted-foreground">
                          {apiKey.start || "????????"}
                          {" ••••••••••••"}
                        </code>
                        {apiKey.start && (
                          <CopyButton
                            value={apiKey.start}
                            className="h-5 w-5"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          apiKey.enabled ? "default" : "secondary"
                        }
                        className="px-1.5"
                      >
                        {apiKey.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <TimeAgo date={apiKey.createdAt} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {apiKey.lastRequest ? (
                        <TimeAgo date={apiKey.lastRequest} />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Never
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right tabular-nums">
                      {apiKey.requestCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Switch
                          size="sm"
                          checked={apiKey.enabled}
                          disabled={togglingId === apiKey.id}
                          onCheckedChange={(checked: boolean) =>
                            handleToggle(apiKey.id, checked)
                          }
                        />
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={deletingId === apiKey.id}
                            >
                              <TrashIcon className="size-3" />
                            </Button>
                          }
                          title="Delete this API key?"
                          description="This action cannot be undone. Any applications using this key will immediately lose access."
                          confirmLabel="Delete"
                          variant="destructive"
                          onConfirm={() => handleDelete(apiKey.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CreateApiKeyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={(key) => {
          setNewlyCreatedKey(key)
          setShowCreateDialog(false)
          // Auto-dismiss after 60 seconds
          setTimeout(() => setNewlyCreatedKey(null), 60_000)
        }}
      />
    </Card>
  )
}
