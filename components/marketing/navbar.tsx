"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheckIcon,
  UserIcon,
  GearIcon,
  SignOutIcon,
  KeyIcon,
  LockKeyIcon,
  ListIcon,
  XIcon,
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
    : "WW"

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-border/60 shadow-xs py-1.5"
          : "bg-background/50 backdrop-blur-xs border-transparent py-2.5"
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-11">
        {/* Compact Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group select-none"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-xs shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
            W
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground text-sm tracking-tight">
              Wallet Ward
            </span>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium border-primary/20 text-primary bg-primary/5 hidden sm:inline-flex">
              v1.0
            </Badge>
          </div>
        </Link>

        {/* Dense Nav Links */}
        <div className="hidden md:flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border border-border/40">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-background/80 transition-all font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth-Aware Controls */}
        <div className="hidden md:flex items-center gap-2">
          {isPending ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5">
                <Link href="/dashboard">
                  <LockKeyIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Vault Dashboard</span>
                </Link>
              </Button>

              {/* Shadcn Dropdown Menu for User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0 ring-1 ring-border/50 hover:ring-primary/40 transition-all"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-semibold leading-none text-foreground">{user.name}</p>
                      <p className="text-[11px] leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="text-xs cursor-pointer">
                      <Link href="/dashboard">
                        <LockKeyIcon className="mr-2 h-3.5 w-3.5" />
                        <span>My Secrets Vault</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-xs cursor-pointer">
                      <Link href="/two-factor/setup">
                        <ShieldCheckIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                        <span>2FA Security Setup</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-xs cursor-pointer">
                      <Link href="/settings">
                        <GearIcon className="mr-2 h-3.5 w-3.5" />
                        <span>Account Settings</span>
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
          ) : (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-medium px-3">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="h-8 text-xs font-semibold px-3 shadow-xs shadow-primary/20">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted/50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon className="w-4 h-4 text-foreground" /> : <ListIcon className="w-4 h-4 text-foreground" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-200 bg-background/95 backdrop-blur-xl border-b border-border/40",
          mobileOpen ? "max-h-96 opacity-100 py-3" : "max-h-0 opacity-0 py-0"
        )}
      >
        <div className="container mx-auto px-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/40 transition-colors font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-border/40">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 py-1 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground truncate">{user.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
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
                <Button asChild variant="outline" size="sm" className="flex-1 h-8 text-xs">
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1 h-8 text-xs font-semibold">
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
