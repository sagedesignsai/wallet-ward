"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  HouseIcon,
  FolderIcon,
  KeyIcon,
  UsersIcon,
  ClockCounterClockwiseIcon,
  GearIcon,
  SignOutIcon,
  ShieldCheckIcon,
  FileTextIcon,
  ListChecksIcon,
  PlugIcon,
} from "@phosphor-icons/react"

import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  SidebarSeparator,
} from "@/components/ui/sidebar"

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: HouseIcon },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Projects", href: "/dashboard/projects", icon: FolderIcon },
      { label: "Secrets", href: "/dashboard/secrets", icon: KeyIcon },
      { label: "Documents", href: "/dashboard/documents", icon: FileTextIcon },
      { label: "Tasks", href: "/dashboard/tasks", icon: ListChecksIcon },
      { label: "Integrations", href: "/dashboard/integrations", icon: PlugIcon },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Organizations", href: "/dashboard/organizations", icon: UsersIcon },
      { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ClockCounterClockwiseIcon },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/")
        },
      },
    })
  }

  return (
    <Sidebar side="left" collapsible="icon" variant="floating">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shadow-primary/20">
                  <span className="font-extrabold text-sm">N</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    Nimbus
                  </span>
                  <span className="truncate text-[10px] text-sidebar-foreground/60">
                    Workspace
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
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
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
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <SignOutIcon className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
