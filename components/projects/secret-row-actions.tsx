"use client"

import { useState, useCallback } from "react"
import {
  DotsThreeVerticalIcon,
  EyeIcon,
  TrashIcon,
} from "@phosphor-icons/react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { CopyButton } from "@/components/dashboard/copy-button"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Secret, SecretWithValue } from "@/hooks/use-secrets"

type SecretRowActionsProps = {
  secret: Secret
  revealedValue: SecretWithValue | null
  onReveal: (secretId: string) => Promise<SecretWithValue | null>
  onDelete: (id: string) => Promise<boolean>
}

export function SecretRowActions({
  secret,
  revealedValue,
  onReveal,
  onDelete,
}: SecretRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)

  const handleReveal = useCallback(async () => {
    setIsRevealing(true)
    await onReveal(secret.id)
    setIsRevealing(false)
    setMenuOpen(false)
  }, [secret.id, onReveal])

  const handleDelete = useCallback(async () => {
    await onDelete(secret.id)
    setMenuOpen(false)
  }, [secret.id, onDelete])

  return (
    <div className="flex items-center gap-0.5">
      {revealedValue && (
        <CopyButton value={revealedValue.value} className="h-6 w-6" />
      )}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <DotsThreeVerticalIcon />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation()
              handleReveal()
            }}
            disabled={isRevealing}
          >
            {isRevealing ? (
              <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : revealedValue ? (
              <EyeIcon />
            ) : (
              <EyeIcon />
            )}
            {revealedValue ? "Refresh Value" : "Reveal Value"}
          </DropdownMenuItem>
          {revealedValue && (
            <DropdownMenuItem
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              asChild
            >
              <div>
                <CopyButton
                  value={revealedValue.value}
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                />
                Copy Value
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <ConfirmDialog
            trigger={
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            }
            title="Delete secret"
            description={`Are you sure you want to delete "${secret.name}"? This will permanently remove this secret and all its version history.`}
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={handleDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
