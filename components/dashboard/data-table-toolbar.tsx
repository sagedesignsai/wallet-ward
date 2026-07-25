"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type DataTableToolbarProps = {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DataTableToolbar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  actions,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className
      )}
    >
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-7 pl-7 text-xs"
        />
      </div>

      {filters && (
        <div className="flex items-center gap-1.5">{filters}</div>
      )}

      {actions && (
        <div className="flex items-center gap-1.5 ml-auto">{actions}</div>
      )}
    </div>
  )
}
