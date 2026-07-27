"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  GearIcon,
  ShieldCheckIcon,
  SignOutIcon,
  CaretDownIcon,
  CheckIcon,
  BuildingsIcon,
  PlusIcon,
  FolderIcon,
} from "@phosphor-icons/react"

import { useAuth } from "@/hooks/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { useProjects } from "@/hooks/use-projects"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useAgentSessions } from "@/hooks/use-agent-sessions"
import { useProjectStore } from "@/stores/project-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { PanelToggleBar } from "@/components/workspace"

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

function ProjectSwitcher() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId)
  const { projects, isLoading } = useProjects()

  if (isLoading || !projects || projects.length === 0) return null
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 gap-1.5 px-2 text-xs">
          <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="hidden max-w-[120px] truncate font-medium text-foreground md:inline">
            {activeProject?.name ?? "Select Project"}
          </span>
          <CaretDownIcon className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FolderIcon className="size-3" />
            Active Project
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((project: any) => (
          <DropdownMenuItem
            key={project.id}
            className={cn(
              "cursor-pointer text-xs",
              project.id === activeProjectId && "bg-accent"
            )}
            onClick={() => setActiveProjectId(project.id)}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
              {project.name}
            </span>
            {project.id === activeProjectId && (
              <CheckIcon
                className="size-3.5 shrink-0 text-primary"
                weight="bold"
              />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-xs text-muted-foreground"
        >
          <Link href="/dashboard/projects/new">
            <PlusIcon className="size-3.5" />
            New Project
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function OrgSwitcher() {
  const {
    organizations,
    activeOrganizationId,
    activeOrganization,
    switchOrganization,
    isLoading,
  } = useOrganization()
  const router = useRouter()

  if (isLoading || organizations.length === 0) return null

  const initials = activeOrganization?.name
    ? activeOrganization.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 gap-1.5 px-2 text-xs">
          <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[9px] font-bold text-primary">
            {initials}
          </div>
          <span className="hidden max-w-[120px] truncate font-medium text-foreground md:inline">
            {activeOrganization?.name ?? "Select Org"}
          </span>
          <CaretDownIcon className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BuildingsIcon className="size-3" />
            Organization
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className={cn(
              "cursor-pointer text-xs",
              org.id === activeOrganizationId && "bg-accent"
            )}
            onClick={() => {
              if (org.id !== activeOrganizationId) {
                switchOrganization(org.id)
              }
            }}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
              {org.name}
              <span className="shrink-0 rounded bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground uppercase">
                {org.role}
              </span>
            </span>
            {org.id === activeOrganizationId && (
              <CheckIcon
                className="size-3.5 shrink-0 text-primary"
                weight="bold"
              />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-xs text-muted-foreground"
          onClick={() => router.push("/dashboard/organizations/new")}
        >
          <PlusIcon className="size-3.5" />
          New Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AgentStatusIndicator() {
  const { sessions } = useAgentSessions()
  const activeSessions = sessions?.filter((s: { status: string }) => s.status === "active") ?? []

  if (activeSessions.length === 0) return null

  return (
    <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-2.5 py-1">
      <div className="size-2 animate-pulse rounded-full bg-green-500" />
      <span className="text-xs font-medium text-green-400">
        {activeSessions.length} agent{activeSessions.length > 1 ? "s" : ""}{" "}
        active
      </span>
    </div>
  )
}

export function DashboardHeader() {
  const { config } = useDashboardConfig()
  const { user, signOut } = useAuth()
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

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "WW"

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-4 backdrop-blur-md">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" />

      <div className="flex flex-1 items-center justify-between gap-4 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Breadcrumbs items={config.breadcrumbs ?? []} />
          {config.description && (
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {config.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {config.actions}

          <AgentStatusIndicator />

          <PanelToggleBar />

          <Separator orientation="vertical" className="h-4!" />

          <ProjectSwitcher />
          <OrgSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 gap-1.5 px-2 text-xs"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={user?.image ?? undefined}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden font-medium text-foreground md:inline">
                  {user?.name ?? "User"}
                </span>
                <CaretDownIcon className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs leading-none font-semibold text-foreground">
                    {user?.name}
                  </p>
                  <p className="truncate text-[11px] leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer text-xs">
                  <Link href="/dashboard/settings">
                    <GearIcon className="mr-2 h-3.5 w-3.5" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer text-xs">
                  <Link href="/two-factor/setup">
                    <ShieldCheckIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                    <span>2FA Security</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <SignOutIcon className="mr-2 h-3.5 w-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
