"use client"

import { useState, Fragment } from "react"
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  EyeIcon,
  ExportIcon,
  DownloadIcon,
  ClockCounterClockwiseIcon,
  CaretDownIcon,
  UserIcon,
  KeyIcon,
} from "@phosphor-icons/react"

import type { AuditLog, AuditAction } from "@/hooks/use-audit-logs"
import { cn } from "@/lib/utils"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Skeleton } from "@/components/ui/skeleton"

// ---------------------------------------------------------------------------
// Action → color, icon, label
// ---------------------------------------------------------------------------

type ActionStyle = {
  bg: string
  text: string
  border: string
  icon: typeof PlusIcon
}

const ACTION_STYLES: Record<string, ActionStyle> = {
  create: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-l-emerald-500/40",
    icon: PlusIcon,
  },
  update: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-l-amber-500/40",
    icon: PencilSimpleIcon,
  },
  delete: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-l-red-500/40",
    icon: TrashIcon,
  },
  reveal: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-l-violet-500/40",
    icon: EyeIcon,
  },
  export: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-l-teal-500/40",
    icon: ExportIcon,
  },
  import: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-l-teal-500/40",
    icon: DownloadIcon,
  },
  version: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-l-blue-500/40",
    icon: ClockCounterClockwiseIcon,
  },
  organization_create: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-l-emerald-500/40",
    icon: PlusIcon,
  },
}

function getActionStyle(action: AuditAction): ActionStyle {
  // Direct match first
  if (ACTION_STYLES[action]) return ACTION_STYLES[action]

  // Fallback: derive from the suffix of compound actions
  const a = action as string
  if (a.endsWith("_create")) return ACTION_STYLES.create
  if (a.endsWith("_update")) return ACTION_STYLES.update
  if (a.endsWith("_delete")) return ACTION_STYLES.delete

  return ACTION_STYLES.update
}

// ---------------------------------------------------------------------------
// Human-readable action description
// ---------------------------------------------------------------------------

function getResourceName(log: AuditLog): string {
  const meta = log.metadata ?? {}
  // Try common metadata keys for the resource name
  return (
    (meta.name as string) ??
    (meta.title as string) ??
    (meta.projectName as string) ??
    (meta.environmentName as string) ??
    (meta.secretName as string) ??
    (meta.resourceName as string) ??
    log.resourceType
  )
}

function describeAction(log: AuditLog): { verb: string; resource: string; detail?: string } {
  const name = getResourceName(log)
  const meta = log.metadata ?? {}

  switch (log.action) {
    case "organization_create":
      return { verb: "Created organization", resource: name }
    case "project_create":
      return { verb: "Created project", resource: name }
    case "project_update":
      return { verb: "Updated project", resource: name }
    case "project_delete":
      return { verb: "Deleted project", resource: name }
    case "environment_create": {
      const parent = meta.projectName as string | undefined
      return {
        verb: "Created environment",
        resource: name,
        detail: parent ? `in ${parent}` : undefined,
      }
    }
    case "environment_update":
      return { verb: "Updated environment", resource: name }
    case "environment_delete":
      return { verb: "Deleted environment", resource: name }
    case "secret_create": {
      const envName = meta.environmentName as string | undefined
      return {
        verb: "Created secret",
        resource: name,
        detail: envName,
      }
    }
    case "secret_update":
      return { verb: "Updated secret", resource: name }
    case "secret_delete":
      return { verb: "Deleted secret", resource: name }
    case "secret_reveal":
      return { verb: "Revealed secret", resource: name }
    case "secret_export":
      return { verb: "Exported secret", resource: name }
    case "secret_import":
      return { verb: "Imported secret", resource: name }
    case "secret_version_create":
      return { verb: "Versioned secret", resource: name }
    case "proposal_create":
      return { verb: "Proposed action", resource: name }
    case "proposal_approve":
      return { verb: "Approved proposal", resource: name }
    case "proposal_reject":
      return { verb: "Rejected proposal", resource: name }
    case "proposal_execute":
      return { verb: "Executed proposal", resource: name }
    case "agent_proxy_call":
      return { verb: "Agent proxy call", resource: name }
    case "integration_create":
      return { verb: "Connected integration", resource: name }
    case "integration_delete":
      return { verb: "Removed integration", resource: name }
    case "document_create":
      return { verb: "Created document", resource: name }
    case "document_update":
      return { verb: "Updated document", resource: name }
    case "document_delete":
      return { verb: "Deleted document", resource: name }
    case "task_create":
      return { verb: "Created task", resource: name }
    case "task_update":
      return { verb: "Updated task", resource: name }
    case "task_delete":
      return { verb: "Deleted task", resource: name }
    default:
      return { verb: String(log.action).replace(/_/g, " "), resource: name }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type LogEntryProps = {
  log: AuditLog
  isFirst?: boolean
  isLast?: boolean
}

export function LogEntry({ log, isFirst = false, isLast = false }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false)
  const style = getActionStyle(log.action)
  const Icon = style.icon
  const { verb, resource, detail } = describeAction(log)

  const metaEntries = log.metadata
    ? Object.entries(log.metadata).filter(
        ([key]) => !["name", "projectName", "environmentName", "secretName", "resourceName"].includes(key)
      )
    : []

  return (
    <div
      className={cn(
        "group relative flex items-stretch border-l-2 transition-colors hover:bg-muted/30",
        style.border,
        isFirst && "rounded-t-lg",
        isLast && "rounded-b-lg",
      )}
    >
      {/* Icon column */}
      <div className="flex w-10 shrink-0 items-center justify-center">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-full ring-1 ring-inset",
            style.bg,
            style.text,
            "ring-current/10"
          )}
        >
          <Icon className="size-3.5" weight="duotone" />
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center py-2.5 pr-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{verb}</span>
          <span className="text-xs font-semibold text-foreground">{resource}</span>
          {detail && (
            <span className="text-xs text-muted-foreground">{detail}</span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2 text-[0.625rem] text-muted-foreground">
          {/* Actor */}
          <span className="inline-flex items-center gap-1">
            {log.actorType === "api_key" ? (
              <KeyIcon className="size-2.5 text-amber-500/70" />
            ) : (
              <UserIcon className="size-2.5 text-blue-500/70" />
            )}
            {log.actorType === "api_key" ? "API Key" : "User"}
            {log.actorUserId && (
              <span className="font-mono text-muted-foreground/60">
                {log.actorUserId.slice(0, 8)}
              </span>
            )}
          </span>

          <span className="text-border">·</span>

          {/* Time */}
          <TimeAgo date={log.createdAt} />

          {/* IP address badge */}
          {log.ipAddress && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono text-muted-foreground/60">{log.ipAddress}</span>
            </>
          )}
        </div>
      </div>

      {/* Expand chevron */}
      {metaEntries.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex shrink-0 items-center justify-center w-8 text-muted-foreground hover:text-foreground transition-colors",
            expanded && "text-foreground"
          )}
          aria-label={expanded ? "Collapse details" : "Expand details"}
        >
          <CaretDownIcon
            className={cn(
              "size-3.5 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
      )}

      {/* Expanded metadata */}
      {expanded && metaEntries.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 border-l-2 bg-card/95 backdrop-blur-sm shadow-lg rounded-b-lg border-l-current/10 overflow-hidden">
          <div className="px-4 py-3 pl-14">
            <dl className="grid gap-px grid-cols-[auto_1fr] text-xs">
              {metaEntries.map(([key, value]) => (
                <Fragment key={key}>
                  <dt className="py-1 pr-3 text-muted-foreground font-medium whitespace-nowrap">
                    {formatKey(key)}
                  </dt>
                  <dd className="py-1 text-foreground font-mono text-[0.625rem]">
                    {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "—")}
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function LogEntrySkeleton() {
  return (
    <div className="flex items-stretch border-l-2 border-l-border/40">
      <div className="flex w-10 shrink-0 items-center justify-center">
        <Skeleton className="size-7 rounded-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-3 gap-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16 rounded-sm" />
          <Skeleton className="h-3 w-24 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-2.5 w-12 rounded-sm" />
          <Skeleton className="h-2.5 w-10 rounded-sm" />
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-center w-8">
        <Skeleton className="size-3.5 rounded-sm" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}
