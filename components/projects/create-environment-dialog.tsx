"use client"

import { useState, useCallback } from "react"
import { StackSimpleIcon } from "@phosphor-icons/react"

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
import type { ProjectEnvironment } from "@/hooks/use-projects"

type CreateEnvironmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (environment: ProjectEnvironment) => void
  projectId: string
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function CreateEnvironmentDialog({
  open,
  onOpenChange,
  onCreated,
  projectId,
}: CreateEnvironmentDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)

  const reset = useCallback(() => {
    setName("")
    setDescription("")
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

      const trimmed = name.trim()
      if (!trimmed) {
        setError("Environment name is required.")
        return
      }
      if (trimmed.length > 100) {
        setError("Environment name must be 100 characters or fewer.")
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/environments`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: trimmed,
              slug: slug || undefined,
              description: description.trim() || undefined,
            }),
          }
        )

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.error?.message ??
              `Failed to create environment (${res.status})`
          )
        }

        const body: { data: ProjectEnvironment } = await res.json()
        onCreated(body.data)
        handleOpenChange(false)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create environment. Please try again."
        )
        setIsSubmitting(false)
      }
    },
    [name, description, slug, projectId, onCreated, handleOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <StackSimpleIcon className="size-4" />
            </div>
            <div>
              <DialogTitle>New Environment</DialogTitle>
              <DialogDescription>
                Create a new environment for this project.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="env-name">Name</Label>
            <Input
              id="env-name"
              placeholder="e.g. Production"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              autoFocus
              maxLength={100}
              disabled={isSubmitting}
            />
            {slug && (
              <p className="text-[0.625rem] text-muted-foreground">
                Slug:{" "}
                <span className="font-mono text-foreground/70">{slug}</span>
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="env-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="env-description"
              placeholder="Brief description of this environment..."
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
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Environment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
