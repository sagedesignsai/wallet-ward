"use client"

import { useCallback, useEffect, useState } from "react"
import { 
  GitBranchIcon, 
  EnvelopeIcon,
  ChatCircleIcon,
  ListChecksIcon,
} from "@phosphor-icons/react"
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

type Provider = "github" | "gmail" | "slack" | "gitlab" | "linear" | "jira" | "notion" | "airtable" | "trello"

const PROVIDER_CONFIG: Record<Provider, {
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  permissions: string[]
}> = {
  github: {
    name: "GitHub",
    icon: GitBranchIcon,
    description: "Connect your GitHub account to enable repository access and PR creation.",
    permissions: ["Access repositories", "Create pull requests", "Read organization info"],
  },
  gmail: {
    name: "Gmail",
    icon: EnvelopeIcon,
    description: "Connect your Gmail account to enable email sending capabilities.",
    permissions: ["Send emails on your behalf", "Read email messages", "View your email address"],
  },
  slack: {
    name: "Slack",
    icon: ChatCircleIcon,
    description: "Connect your Slack workspace to send notifications and messages.",
    permissions: ["Send messages to channels", "Read channel list", "Read user info"],
  },
  gitlab: {
    name: "GitLab",
    icon: GitBranchIcon,
    description: "Connect your GitLab account to enable repository access and MR creation.",
    permissions: ["Access repositories", "Create merge requests", "Read user info"],
  },
  linear: {
    name: "Linear",
    icon: ListChecksIcon,
    description: "Connect your Linear workspace to create and manage issues.",
    permissions: ["Create and update issues", "Read projects and teams", "Read user info"],
  },
  jira: {
    name: "Jira",
    icon: ListChecksIcon,
    description: "Connect your Jira workspace to create and manage issues across projects.",
    permissions: ["Read and write Jira work", "Read user information", "Offline access"],
  },
  notion: {
    name: "Notion",
    icon: ListChecksIcon,
    description: "Connect your Notion workspace to create and manage pages and databases.",
    permissions: ["Read and write content", "Access workspace pages", "Read user info"],
  },
  airtable: {
    name: "Airtable",
    icon: ListChecksIcon,
    description: "Connect your Airtable account to read and write records in bases.",
    permissions: ["Read records", "Write records", "Read base schema"],
  },
  trello: {
    name: "Trello",
    icon: ListChecksIcon,
    description: "Connect your Trello account to create and manage cards and boards.",
    permissions: ["Read and write cards", "Access boards and lists", "Read user info"],
  },
}

export function ConnectIntegrationDialog({
  open,
  onOpenChange,
  projects,
  defaultProjectId,
  provider,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; name: string; slug: string }[]
  defaultProjectId?: string
  provider: Provider
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    defaultProjectId ?? null
  )
  const [connecting, setConnecting] = useState(false)

  const config = PROVIDER_CONFIG[provider]
  const Icon = config.icon

  useEffect(() => {
    if (open && defaultProjectId) {
      setSelectedProjectId(defaultProjectId)
    }
  }, [open, defaultProjectId])

  const handleConnect = useCallback(async () => {
    if (!selectedProjectId) return
    setConnecting(true)
    try {
      const res = await fetch(`/api/integrations/${provider}/connect`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      })
      if (!res.ok) {
        throw new Error(`Failed to initiate ${config.name} connection (${res.status})`)
      }
      const body = await res.json()
      if (body.url) {
        window.location.href = body.url
      }
    } catch {
      setConnecting(false)
    }
  }, [selectedProjectId, provider, config.name])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" />
            Connect {config.name}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Select a project to connect to {config.name}. This will start the OAuth
            flow to link your account.
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
            <p className="font-medium mb-1">Permissions requested:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {config.permissions.map((permission, i) => (
                <li key={i}>{permission}</li>
              ))}
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
            onClick={handleConnect}
            disabled={!selectedProjectId || connecting}
          >
            <Icon className="size-3.5" />
            {connecting ? "Connecting\u2026" : `Connect ${config.name}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
