"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ComponentType } from "react"
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SectionNavItem = {
  id: string
  label: string
  /** Path suffix relative to base, or "" for the base route */
  href: string
  icon: ComponentType<{ className?: string }>
  /** When true, shown in the primary row; otherwise in More / mobile select */
  primary?: boolean
}

type SectionNavProps = {
  base: string
  items: SectionNavItem[]
  className?: string
}

function resolveActiveId(pathname: string, base: string, items: SectionNavItem[]) {
  // Prefer longest matching href so nested routes highlight correctly
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length)
  return (
    sorted.find((item) => {
      if (item.href === "") return pathname === base
      return pathname.startsWith(`${base}${item.href}`)
    })?.id ?? items[0]?.id
  )
}

export function SectionNav({ base, items, className }: SectionNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const activeId = resolveActiveId(pathname, base, items)

  const hasExplicitPrimary = items.some((i) => i.primary === true)
  const primaryItems = hasExplicitPrimary
    ? items.filter((i) => i.primary)
    : items
  const moreItems = hasExplicitPrimary
    ? items.filter((i) => !i.primary)
    : []

  const activeItem = items.find((i) => i.id === activeId)
  const activeInMore = moreItems.some((i) => i.id === activeId)

  const toHref = (item: SectionNavItem) => `${base}${item.href}`

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Mobile: single section selector */}
      <div className="sm:hidden">
        <Select
          value={activeId}
          onValueChange={(id: string) => {
            const item = items.find((i) => i.id === id)
            if (item) router.push(toHref(item))
          }}
        >
          <SelectTrigger className="h-9 w-full text-xs">
            <SelectValue placeholder="Navigate…" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => {
              const Icon = item.icon
              return (
                <SelectItem key={item.id} value={item.id} className="text-xs">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-3.5 shrink-0" />
                    {item.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: primary links + optional More */}
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
        <nav className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === activeId
            return (
              <Link
                key={item.id}
                href={toHref(item)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {moreItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 text-xs font-medium",
                  activeInMore && "border-primary/30 bg-primary/5 text-foreground"
                )}
              >
                {activeInMore && activeItem ? activeItem.label : "More"}
                <CaretDownIcon className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              {moreItems.map((item) => {
                const Icon = item.icon
                const isActive = item.id === activeId
                return (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link
                      href={toHref(item)}
                      className="flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <CheckIcon className="size-3.5 text-primary" />
                      )}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
