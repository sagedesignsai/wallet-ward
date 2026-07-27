"use client"

import {
  HouseIcon,
  UsersIcon,
  ClockCounterClockwiseIcon,
  GearIcon,
} from "@phosphor-icons/react"

import { SectionNav } from "@/components/dashboard/section-nav"

type OrgNavProps = {
  orgId: string
}

const ITEMS = [
  {
    id: "overview",
    label: "Overview",
    href: "",
    icon: HouseIcon,
    primary: true,
  },
  {
    id: "members",
    label: "Members",
    href: "/members",
    icon: UsersIcon,
    primary: true,
  },
  {
    id: "activity",
    label: "Activity",
    href: "/activity",
    icon: ClockCounterClockwiseIcon,
    primary: true,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: GearIcon,
    primary: true,
  },
]

export function OrgNav({ orgId }: OrgNavProps) {
  return <SectionNav base={`/dashboard/organizations/${orgId}`} items={ITEMS} />
}
