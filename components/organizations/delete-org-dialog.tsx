"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { WarningIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type DeleteOrgDialogProps = {
  orgName: string
  onDelete: () => Promise<boolean>
  trigger?: React.ReactNode
}

export function DeleteOrgDialog({
  orgName,
  onDelete,
  trigger,
}: DeleteOrgDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isConfirmMatch = confirmText.trim() === orgName

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleDelete = useCallback(async () => {
    if (!isConfirmMatch) return

    setIsDeleting(true)
    setError(null)

    const success = await onDelete()

    if (success) {
      setIsOpen(false)
      router.push("/dashboard/organizations")
    } else {
      setError("Failed to delete organization. Please try again.")
      setIsDeleting(false)
    }
  }, [isConfirmMatch, onDelete, router])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setConfirmText("")
      setIsDeleting(false)
      setError(null)
    }
  }, [])

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive" size="default">
            Delete Organization
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <WarningIcon className="size-4 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this organization?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{orgName}&rdquo; and all its
            projects, environments, secrets, and audit logs. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 px-6 py-2">
          <label className="text-xs text-muted-foreground">
            Type <span className="font-medium text-foreground">{orgName}</span>{" "}
            to confirm
          </label>
          <Input
            ref={inputRef}
            placeholder={orgName}
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value)
              if (error) setError(null)
            }}
            disabled={isDeleting}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!isConfirmMatch || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <>
                <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              "Delete Organization"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
