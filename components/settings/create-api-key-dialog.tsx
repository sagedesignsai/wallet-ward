"use client"

import { useState, useCallback } from "react"
import { KeyIcon, WarningIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

import { useApiKeys } from "@/hooks/use-api-keys"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"

type CreateApiKeyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (key: string) => void
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateApiKeyDialogProps) {
  const { createKey } = useApiKeys()

  const [name, setName] = useState("")
  const [expiration, setExpiration] = useState<string>("never")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return

    setIsCreating(true)
    setError(null)

    let expiresIn: number | undefined
    const days = Number(expiration)
    if (!isNaN(days) && days > 0) {
      expiresIn = days * 24 * 60 * 60 * 1000 // Convert days to ms
    }

    const result = await createKey({
      name: name.trim(),
      expiresIn,
    })

    if (result?.key) {
      setName("")
      setExpiration("never")
      onCreated(result.key)
      toast.success("API key created")
    } else {
      setError("Failed to create API key")
    }

    setIsCreating(false)
  }, [name, expiration, createKey, onCreated])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setName("")
        setExpiration("never")
        setError(null)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
              <KeyIcon className="size-3.5" />
            </div>
            Create API Key
          </DialogTitle>
          <DialogDescription>
            Generate a new API key for programmatic access to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              id="api-key-name"
              placeholder="e.g. CI Pipeline, Local Dev"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              disabled={isCreating}
              autoFocus
              maxLength={100}
            />
            <p className="text-[0.65rem] text-muted-foreground">
              A descriptive name to help you identify this key later
            </p>
          </div>

          {/* Expiration */}
          <div className="grid gap-2">
            <Label htmlFor="api-key-expiration">Expiration</Label>
            <NativeSelect
              id="api-key-expiration"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              disabled={isCreating}
            >
              <NativeSelectOption value="never">Never</NativeSelectOption>
              <NativeSelectOption value="30">30 days</NativeSelectOption>
              <NativeSelectOption value="90">90 days</NativeSelectOption>
              <NativeSelectOption value="365">1 year</NativeSelectOption>
            </NativeSelect>
          </div>

          {/* Warning */}
          <div className="rounded-md bg-muted/50 p-2.5">
            <div className="flex items-start gap-2">
              <WarningIcon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[0.65rem] text-muted-foreground leading-relaxed">
                The API key will only be shown once after creation. Make sure to
                copy and store it securely before closing this dialog.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive animate-in fade-in">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
