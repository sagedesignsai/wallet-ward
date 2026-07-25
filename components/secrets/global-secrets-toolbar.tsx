"use client"

import {
  MagnifyingGlassIcon,
  XIcon,
  FunnelSimpleIcon,
} from "@phosphor-icons/react"

import type { GlobalSecretFilters } from "@/hooks/use-global-secrets"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type FilterOption = { id: string; name: string }

type GlobalSecretsToolbarProps = {
  filters: GlobalSecretFilters
  activeFilterCount: number
  projects: FilterOption[]
  environments: FilterOption[]
  types: string[]
  onFilterChange: (key: keyof GlobalSecretFilters, value: string | null) => void
  onClearFilters: () => void
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

export function GlobalSecretsToolbar({
  filters,
  activeFilterCount,
  projects,
  environments,
  types,
  onFilterChange,
  onClearFilters,
}: GlobalSecretsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search secrets..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="h-7 pl-7 text-xs"
        />
      </div>

      {/* Project Filter */}
      <Select
        value={filters.projectId ?? "all"}
        onValueChange={(v: string) =>
          onFilterChange("projectId", v === "all" ? null : v)
        }
      >
        <SelectTrigger size="sm" className="h-7">
          <FunnelSimpleIcon className="size-3 text-muted-foreground" />
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Environment Filter */}
      <Select
        value={filters.environmentId ?? "all"}
        onValueChange={(v: string) =>
          onFilterChange("environmentId", v === "all" ? null : v)
        }
      >
        <SelectTrigger size="sm" className="h-7">
          <FunnelSimpleIcon className="size-3 text-muted-foreground" />
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Environments</SelectItem>
          {environments.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select
        value={filters.type ?? "all"}
        onValueChange={(v: string) =>
          onFilterChange("type", v === "all" ? null : v)
        }
      >
        <SelectTrigger size="sm" className="h-7">
          <FunnelSimpleIcon className="size-3 text-muted-foreground" />
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {types.map((t) => (
            <SelectItem key={t} value={t}>
              {typeLabel(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Active Filter Badge + Clear */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="px-1.5 tabular-nums">
            {activeFilterCount} active
          </Badge>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClearFilters}
            aria-label="Clear all filters"
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
