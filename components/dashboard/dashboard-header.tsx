"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  GearIcon,
  ShieldCheckIcon,
  SignOutIcon,
  CaretDownIcon,
} from "@phosphor-icons/react"

import { useAuth } from "@/hooks/use-auth"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
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

function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[]
}) {
  if (!items || items.length === 0) return null

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
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
      <Separator orientation="vertical" className="h-4!" />

      <div className="flex flex-1 items-center justify-between gap-4 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Breadcrumbs items={config.breadcrumbs ?? []} />
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold leading-none text-foreground">
              {config.title}
            </h1>
            {config.description && (
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                {config.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config.actions}

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
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
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
                  <p className="text-xs font-semibold leading-none text-foreground">
                    {user?.name}
                  </p>
                  <p className="text-[11px] leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link href="/dashboard/settings">
                    <GearIcon className="mr-2 h-3.5 w-3.5" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link href="/two-factor/setup">
                    <ShieldCheckIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                    <span>2FA Security</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs text-destructive focus:text-destructive cursor-pointer"
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
