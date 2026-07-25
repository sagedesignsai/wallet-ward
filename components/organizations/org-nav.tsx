"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HouseIcon,
  UsersIcon,
  GearIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

type OrgNavProps = {
  orgId: string
}

const tabs = [
  {
    label: "Overview",
    href: "", // base route
    icon: HouseIcon,
  },
  {
    label: "Members",
    href: "/members",
    icon: UsersIcon,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: GearIcon,
  },
]

export function OrgNav({ orgId }: OrgNavProps) {
  const pathname = usePathname()
  const base = `/dashboard/organizations/${orgId}`

  return (
    <div className="flex flex-col gap-2">
      {/* Back link */}
      <Link
        href="/dashboard/organizations"
        className="group inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3 transition-transform group-hover:-translate-x-0.5" />
        All Organizations
      </Link>

      {/* Tab bar */}
      <nav className="flex items-center gap-0.5 border-b border-border/40">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`
          const isActive =
            tab.href === ""
              ? pathname === base
              : pathname.startsWith(href)

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-t-md px-3 text-xs font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
