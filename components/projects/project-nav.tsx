"use client"

import {
  HouseIcon,
  StackSimpleIcon,
  GearIcon,
  FileTextIcon,
  ListChecksIcon,
  ClockCounterClockwiseIcon,
  RobotIcon,
  CheckCircleIcon,
  PlugIcon,
  GitBranchIcon,
  FolderIcon,
} from "@phosphor-icons/react"

import { SectionNav } from "@/components/dashboard/section-nav"

type ProjectNavProps = {
  projectId: string
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
    id: "environments",
    label: "Environments",
    href: "/environments",
    icon: StackSimpleIcon,
    primary: true,
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/tasks",
    icon: ListChecksIcon,
    primary: true,
  },
  {
    id: "agents",
    label: "Agents",
    href: "/agents",
    icon: RobotIcon,
    primary: true,
  },
  {
    id: "repositories",
    label: "Repositories",
    href: "/repositories",
    icon: GitBranchIcon,
  },
  {
    id: "files",
    label: "Files",
    href: "/files",
    icon: FolderIcon,
  },
  {
    id: "documents",
    label: "Documents",
    href: "/documents",
    icon: FileTextIcon,
  },
  {
    id: "proposals",
    label: "Proposals",
    href: "/proposals",
    icon: CheckCircleIcon,
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/integrations",
    icon: PlugIcon,
  },
  {
    id: "activity",
    label: "Activity",
    href: "/activity",
    icon: ClockCounterClockwiseIcon,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: GearIcon,
  },
]

export function ProjectNav({ projectId }: ProjectNavProps) {
  return <SectionNav base={`/dashboard/projects/${projectId}`} items={ITEMS} />
}
