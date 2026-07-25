"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HouseIcon,
  StackSimpleIcon,
  GearIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react"

import { SegmentedControl } from "@/components/ui/segmented-control"

type ProjectNavProps = {
  projectId: string
}

const tabs = [
  {
    id: "overview",
    label: "Overview",
    href: "", // base route
    icon: HouseIcon,
  },
  {
    id: "environments",
    label: "Environments",
    href: "/environments",
    icon: StackSimpleIcon,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: GearIcon,
  },
]

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()
  const base = `/dashboard/projects/${projectId}`

  // Determine which tab is active based on the current route.
  const activeId =
    tabs.find((tab) => {
      if (tab.href === "") return pathname === base
      return pathname.startsWith(`${base}${tab.href}`)
    })?.id ?? "overview"

  // Resolve hrefs relative to the project base.
  const resolvedTabs = tabs.map((tab) => ({
    ...tab,
    href: `${base}${tab.href}`,
  }))

  return (
    <div className="flex flex-col gap-3">
      {/* Back link */}
      <Link
        href="/dashboard/projects"
        className="group inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3 transition-transform group-hover:-translate-x-0.5" />
        All Projects
      </Link>

      {/* Segmented tab bar */}
      <SegmentedControl
        tabs={resolvedTabs}
        value={activeId}
      />
    </div>
  )
}
