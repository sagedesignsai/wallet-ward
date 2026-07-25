"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  XIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  KeyIcon,
  CertificateIcon,
  FileJsIcon,
  FileIcon,
  NoteIcon,
} from "@phosphor-icons/react"

import type { GlobalSecret, GlobalSecretWithValue } from "@/hooks/use-global-secrets"
import { SensitiveValue } from "@/components/dashboard/sensitive-value"
import { CopyButton } from "@/components/dashboard/copy-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type SecretExpandPanelProps = {
  secret: GlobalSecret
  revealedValue: GlobalSecretWithValue
  onClose: () => void
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    env_var: "Env Var",
    password: "Password",
    api_token: "API Token",
    ssh_keypair: "SSH Key",
    certificate: "Certificate",
    json: "JSON",
    file: "File",
    note: "Note",
  }
  return labels[type] ?? type
}

function typeBadgeVariant(
  type: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "password":
      return "destructive"
    case "api_token":
      return "default"
    case "env_var":
      return "secondary"
    case "ssh_keypair":
      return "outline"
    case "certificate":
      return "outline"
    case "json":
      return "muted" as "secondary"
    case "file":
      return "muted" as "secondary"
    case "note":
      return "ghost" as "secondary"
    default:
      return "secondary"
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "password":
      return LockKeyIcon
    case "api_token":
      return ShieldCheckIcon
    case "ssh_keypair":
      return KeyIcon
    case "certificate":
      return CertificateIcon
    case "json":
      return FileJsIcon
    case "file":
      return FileIcon
    case "note":
      return NoteIcon
    default:
      return KeyIcon
  }
}

export function SecretExpandPanel({
  secret,
  revealedValue,
  onClose,
}: SecretExpandPanelProps) {
  const Icon = typeIcon(secret.type)

  return (
    <div className="animate-in slide-in-from-top-1 fade-in duration-200 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-5 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
            <Icon className="size-3" />
          </div>
          <span className="truncate text-xs font-medium text-foreground">
            {secret.name}
          </span>
          <Badge variant={typeBadgeVariant(secret.type)}>
            {typeLabel(secret.type)}
          </Badge>
          <span className="shrink-0 font-mono text-[0.625rem] text-muted-foreground tabular-nums">
            v{revealedValue.version}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CopyButton value={revealedValue.value} />
          <Link
            href={`/dashboard/projects/${secret.projectId}/environments/${secret.environmentId}`}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowRightIcon className="size-3" />
              <span className="sr-only">Open in Project</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close panel"
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <SensitiveValue
          value={revealedValue.value}
          className="w-full"
        />
      </div>
    </div>
  )
}
