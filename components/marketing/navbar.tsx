"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import { Logomark } from "@/components/brand/logo"
import {
  UserIcon,
  GearIcon,
  SignOutIcon,
  KeyIcon,
  LockKeyIcon,
  ListIcon,
  XIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react"

import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
]

export function MarketingNavbar() {
  const router = useRouter()
  const { user, isAuthenticated, isPending, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
    : "NW"

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 border-b transition-all duration-200",
        scrolled
          ? "border-border/60 bg-background/90 py-1.5 shadow-xs backdrop-blur-md"
          : "border-transparent bg-background/50 py-2.5 backdrop-blur-xs"
      )}
    >
      <nav className="container mx-auto flex h-11 items-center justify-between px-4 sm:px-6">
        {/* Compact Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 select-none"
          onClick={() => setMobileOpen(false)}
        >
          <Logomark size={22} animated={false} />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-foreground">
              Flowspace
            </span>
            <Badge
              variant="outline"
              className="hidden h-4 border-primary/20 bg-primary/5 px-1.5 text-[10px] font-medium text-primary sm:inline-flex"
            >
              v1.0
            </Badge>
          </div>
        </Link>

        {/* Dense Nav Links */}
        <div className="hidden items-center gap-0.5 rounded-lg border border-border/40 bg-muted/40 p-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-background/80 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth-Aware Controls */}
        <div className="hidden items-center gap-2 md:flex">
          {isPending ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <Link href="/dashboard">
                  <LockKeyIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Vault Dashboard</span>
                </Link>
              </Button>

              {/* Shadcn Dropdown Menu for User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0 ring-1 ring-border/50 transition-all hover:ring-primary/40"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name ?? "User"}
                      />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs leading-none font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-[11px] leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer text-xs"
                    >
                      <Link href="/dashboard">
                        <LockKeyIcon className="mr-2 h-3.5 w-3.5" />
                        <span>My Secrets Vault</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer text-xs"
                    >
                      <Link href="/two-factor/setup">
                        <ShieldCheckIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                        <span>2FA Security Setup</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer text-xs"
                    >
                      <Link href="/settings">
                        <GearIcon className="mr-2 h-3.5 w-3.5" />
                        <span>Account Settings</span>
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
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-medium"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 px-3 text-xs font-semibold shadow-xs shadow-primary/20"
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/50 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <XIcon className="h-4 w-4 text-foreground" />
          ) : (
            <ListIcon className="h-4 w-4 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "overflow-hidden border-b border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-200 md:hidden",
          mobileOpen ? "max-h-96 py-3 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <div className="container mx-auto flex flex-col gap-1 px-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-border/40 pt-2">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-medium text-foreground">
                    {user.email}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                    >
                      Vault
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setMobileOpen(false)
                      handleSignOut()
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 text-xs"
                >
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-8 flex-1 text-xs font-semibold"
                >
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
