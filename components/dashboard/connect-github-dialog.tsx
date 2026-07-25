"use client"

import { useCallback, useState } from "react"
import { GitBranchIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ConnectGitHubDialog({
  open,
  onOpenChange,
  projects,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; name: string; slug: string }[]
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const handleConnectGitHub = useCallback(async () => {
    if (!selectedProjectId) return
    setConnecting(true)
    try {
      const res = await fetch("/api/integrations/github/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      })
      if (!res.ok) {
        throw new Error(`Failed to initiate GitHub connection (${res.status})`)
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
          <DialogTitle>Connect GitHub</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Select a project to connect to GitHub. This will start the OAuth
            flow to link your GitHub account.
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
            onClick={handleConnectGitHub}
            disabled={!selectedProjectId || connecting}
          >
            {connecting ? "Connecting\u2026" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
