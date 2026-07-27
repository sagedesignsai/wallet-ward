"use client"

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionCategory =
  "all" | "projects" | "environments" | "secrets" | "proposals" | "organization"
export type ActorFilter = "all" | "user" | "api_key"

type LogFiltersProps = {
  category: ActionCategory
  onCategoryChange: (c: ActionCategory) => void
  actorType: ActorFilter
  onActorTypeChange: (a: ActorFilter) => void
  search: string
  onSearchChange: (s: string) => void
  activeCount: number
  onClearAll: () => void
}

// ---------------------------------------------------------------------------
// Category pill buttons
// ---------------------------------------------------------------------------

const CATEGORIES: { value: ActionCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "projects", label: "Projects" },
  { value: "environments", label: "Environments" },
  { value: "secrets", label: "Secrets" },
  { value: "proposals", label: "Proposals" },
  { value: "organization", label: "Organization" },
]

const ACTOR_OPTIONS: { value: ActorFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "user", label: "Users" },
  { value: "api_key", label: "API Keys" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LogFilters({
  category,
  onCategoryChange,
  actorType,
  onActorTypeChange,
  search,
  onSearchChange,
  activeCount,
  onClearAll,
}: LogFiltersProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Top row: search + clear */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search metadata…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearAll}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-2.5" />
            Clear
            <Badge variant="secondary" className="ml-0.5 px-1 tabular-nums">
              {activeCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Bottom row: segmented controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Action category */}
        <div className="inline-flex items-center rounded-md bg-muted/40 p-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                "relative h-6 rounded-[min(var(--radius-md),6px)] px-2.5 text-[0.625rem] font-medium transition-all",
                category === cat.value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/8"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Actor type */}
        <div className="inline-flex items-center rounded-md bg-muted/40 p-0.5">
          {ACTOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onActorTypeChange(opt.value)}
              className={cn(
                "relative h-6 rounded-[min(var(--radius-md),6px)] px-2.5 text-[0.625rem] font-medium transition-all",
                actorType === opt.value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/8"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
