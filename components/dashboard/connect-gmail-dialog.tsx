"use client"

import { useCallback, useEffect, useState } from "react"
import { EnvelopeIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ConnectGmailDialog({
  open,
  onOpenChange,
  projects,
  defaultProjectId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; name: string; slug: string }[]
  defaultProjectId?: string
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    defaultProjectId ?? null
  )
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (open && defaultProjectId) {
      setSelectedProjectId(defaultProjectId)
    }
  }, [open, defaultProjectId])

  const handleConnectGmail = useCallback(async () => {
    if (!selectedProjectId) return
    setConnecting(true)
    try {
      const res = await fetch("/api/integrations/gmail/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      })
      if (!res.ok) {
        throw new Error(`Failed to initiate Gmail connection (${res.status})`)
      }
      const body = await res.json()
      if (body.url) {
        window.location.href = body.url
      }
    } catch {
      setConnecting(false)
    }
  }, [selectedProjectId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Gmail</DialogTitle>
          <DialogDescription>
            Connect your Gmail account to enable email sending capabilities for
            agents.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Select a project to connect to Gmail. This will start the OAuth flow
            to link your Google account with permissions to send and read
            emails.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-select">Project</Label>
            <Select
              value={selectedProjectId ?? ""}
              onValueChange={(val: string) => setSelectedProjectId(val)}
            >
              <SelectTrigger id="project-select" className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium">Permissions requested:</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Send emails on your behalf</li>
              <li>Read email messages</li>
              <li>View your email address</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={connecting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnectGmail}
            disabled={!selectedProjectId || connecting}
          >
            <EnvelopeIcon className="size-3.5" />
            {connecting ? "Connecting\u2026" : "Connect Gmail"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
