"use client"

import { useState, useCallback } from "react"
import {
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  CertificateIcon,
  FileJsIcon,
  FileIcon,
  NoteIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Secret } from "@/hooks/use-secrets"

type CreateSecretDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (secret: Secret) => void
  createSecret: (input: {
    name: string
    value: string
    description?: string
    type?: string
  }) => Promise<Secret | null>
}

const secretTypes = [
  { value: "env_var", label: "Environment Variable", icon: KeyIcon },
  { value: "password", label: "Password", icon: LockKeyIcon },
  { value: "api_token", label: "API Token", icon: ShieldCheckIcon },
  { value: "ssh_keypair", label: "SSH Key", icon: KeyIcon },
  { value: "certificate", label: "Certificate", icon: CertificateIcon },
  { value: "json", label: "JSON", icon: FileJsIcon },
  { value: "file", label: "File", icon: FileIcon },
  { value: "note", label: "Note", icon: NoteIcon },
]

export function CreateSecretDialog({
  open,
  onOpenChange,
  onCreated,
  createSecret,
}: CreateSecretDialogProps) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [type, setType] = useState<string>("env_var")
  const [description, setDescription] = useState("")
  const [showValue, setShowValue] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setName("")
    setValue("")
    setType("env_var")
    setDescription("")
    setShowValue(false)
    setError(null)
    setIsSubmitting(false)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset()
      onOpenChange(nextOpen)
    },
    [onOpenChange, reset]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmedName = name.trim()
      if (!trimmedName) {
        setError("Secret name is required.")
        return
      }

      if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
        setError(
          "Secret name can only contain letters, numbers, dots, underscores, slashes, and hyphens."
        )
        return
      }

      if (!value) {
        setError("Secret value is required.")
        return
      }

      setIsSubmitting(true)
      setError(null)

      const secret = await createSecret({
        name: trimmedName,
        value,
        description: description.trim() || undefined,
        type,
      })

      if (secret) {
        onCreated(secret)
        handleOpenChange(false)
      } else {
        setError("Failed to create secret. Please try again.")
        setIsSubmitting(false)
      }
    },
    [name, value, type, description, createSecret, onCreated, handleOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyIcon className="size-4" />
            </div>
            <div>
              <DialogTitle>New Secret</DialogTitle>
              <DialogDescription>
                Add a new secret to this environment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="secret-name">Name</Label>
            <Input
              id="secret-name"
              placeholder="e.g. DATABASE_URL"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              autoFocus
              className="font-mono"
              disabled={isSubmitting}
            />
            <p className="text-[0.625rem] text-muted-foreground">
              Alphanumeric, dots, underscores, slashes, and hyphens only.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="secret-value">Value</Label>
            <div className="relative">
              <Input
                id="secret-value"
                type={showValue ? "text" : "password"}
                placeholder="Enter secret value"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  if (error) setError(null)
                }}
                className="pr-8 font-mono"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-0 right-0 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowValue((s) => !s)}
                tabIndex={-1}
              >
                {showValue ? (
                  <EyeSlashIcon className="size-3.5" />
                ) : (
                  <EyeIcon className="size-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={setType}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {secretTypes.map((st) => (
                  <SelectItem key={st.value} value={st.value}>
                    <span className="flex items-center gap-2">
                      <st.icon className="size-3.5" />
                      {st.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="secret-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="secret-description"
              placeholder="Brief description of this secret..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none text-xs"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !value || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Secret"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
