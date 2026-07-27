"use client"

import { useState } from "react"
import {
  LinkIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FileShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  projectId: string
  onShareCreated?: () => void
}

/* ------------------------------------------------------------------ */
/*  FileShareDialog                                                    */
/* ------------------------------------------------------------------ */

export function FileShareDialog({
  open,
  onOpenChange,
  fileId,
  projectId,
  onShareCreated,
}: FileShareDialogProps) {
  const [expiration, setExpiration] = useState("")
  const [maxDownloads, setMaxDownloads] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {}

      if (expiration) {
        body.expiresAt = new Date(expiration).toISOString()
      }
      if (maxDownloads) {
        body.maxDownloads = parseInt(maxDownloads, 10)
      }

      const res = await fetch(
        `/api/v1/projects/${projectId}/files/${fileId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.error ?? "Failed to create share link")
      }

      const data = await res.json()
      const url = data.data?.url ?? data.data?.shareUrl ?? ""

      setShareUrl(url)
      onShareCreated?.()
      toast.success("Share link created")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create share link"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset state on close
      setExpiration("")
      setMaxDownloads("")
      setShareUrl(null)
      setCopied(false)
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="size-4" />
            Share File
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for this file.
          </DialogDescription>
        </DialogHeader>

        {shareUrl ? (
          /* ---- Share URL display ---- */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[0.625rem] text-muted-foreground">
              Anyone with this link can access the file according to the
              configured settings.
            </p>
          </div>
        ) : (
          /* ---- Share form ---- */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="share-expiration">
                Expiration{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="share-expiration"
                type="datetime-local"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-[0.625rem] text-muted-foreground">
                Leave empty for no expiration
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-max-downloads">
                Max Downloads{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="share-max-downloads"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-[0.625rem] text-muted-foreground">
                Leave empty for unlimited downloads
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="size-3.5" />
                    Create Share Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
