"use client"

import { usePathname } from "next/navigation"
import {
  HouseIcon,
  UsersIcon,
  GearIcon,
} from "@phosphor-icons/react"

import { SegmentedControl } from "@/components/ui/segmented-control"

type OrgNavProps = {
  orgId: string
}

const tabs = [
  {
    id: "overview",
    label: "Overview",
    href: "", // base route
    icon: HouseIcon,
  },
  {
    id: "members",
    label: "Members",
    href: "/members",
    icon: UsersIcon,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: GearIcon,
  },
]

export function OrgNav({ orgId }: OrgNavProps) {
  const pathname = usePathname()
  const base = `/dashboard/organizations/${orgId}`

  // Determine which tab is active based on the current route.
  const activeId =
    tabs.find((tab) => {
      if (tab.href === "") return pathname === base
      return pathname.startsWith(`${base}${tab.href}`)
    })?.id ?? "overview"

  // Resolve hrefs relative to the org base.
  const resolvedTabs = tabs.map((tab) => ({
    ...tab,
    href: `${base}${tab.href}`,
  }))

  return (
    <SegmentedControl
      tabs={resolvedTabs}
      value={activeId}
    />
  )
}
