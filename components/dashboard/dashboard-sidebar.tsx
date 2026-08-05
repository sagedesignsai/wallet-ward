"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logomark } from "@/components/brand/logo"
import {
  FolderIcon,
  KeyIcon,
  UsersIcon,
  ClockCounterClockwiseIcon,
  GearIcon,
  ShieldCheckIcon,
  FileTextIcon,
  ListChecksIcon,
  PlugIcon,
  RobotIcon,
  CheckCircleIcon,
  HouseIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react"

import { usePendingApprovals } from "@/hooks/use-pending-approvals"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { count: pendingCount } = usePendingApprovals()

  const NAV_GROUPS = [
    {
      label: "Overview",
      items: [
        { label: "Overview", href: "/dashboard/overview", icon: HouseIcon },
      ],
    },
    {
      label: "⚡ Autonomous",
      items: [
        {
          label: "Workspace",
          href: "/dashboard/workspace",
          icon: SquaresFourIcon,
        },
        {
          label: "Sessions",
          href: "/dashboard/sessions",
          icon: RobotIcon,
        },
        {
          label: "Proposals",
          href: "/dashboard/proposals",
          icon: CheckCircleIcon,
          badge: pendingCount > 0 ? String(pendingCount) : null,
          badgeVariant: "urgent" as const,
        },
        { label: "Tasks", href: "/dashboard/tasks", icon: ListChecksIcon },
      ],
    },
    {
      label: "🔒 Secure Vault",
      items: [
        { label: "Projects", href: "/dashboard/projects", icon: FolderIcon },
        { label: "Secrets & Keys", href: "/dashboard/secrets", icon: KeyIcon },
        {
          label: "Documents",
          href: "/dashboard/documents",
          icon: FileTextIcon,
        },
        {
          label: "Audit Logs",
          href: "/dashboard/audit-logs",
          icon: ClockCounterClockwiseIcon,
        },
      ],
    },
    {
      label: "🔌 Augmentation",
      items: [
        {
          label: "Integrations",
          href: "/dashboard/integrations",
          icon: PlugIcon,
        },
        {
          label: "Organizations",
          href: "/dashboard/organizations",
          icon: UsersIcon,
        },
      ],
    },
  ]

  return (
    <Sidebar side="left" collapsible="icon" variant="floating">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Logomark size={40} animated={false} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    Flowspace
                  </span>
                  <span className="truncate text-[10px] text-sidebar-foreground/60">
                    Autonomous Engine
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard/overview"
                      ? pathname === "/dashboard/overview"
                      : pathname.startsWith(item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          className="flex w-full items-center gap-2"
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {"badge" in item && item.badge && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "ml-auto h-4 shrink-0 px-1.5 text-[9px] font-bold",
                                item.badgeVariant === "urgent"
                                  ? "animate-pulse border-amber-500/25 bg-amber-500/15 text-amber-400"
                                  : "border-primary/20 bg-primary/15 text-primary"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/dashboard/settings">
                <GearIcon className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="2FA Security">
              <Link href="/two-factor/setup">
                <ShieldCheckIcon className="size-4" />
                <span>2FA Security</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
