"use client"

import Link from "next/link"
import {
  CheckIcon,
  ArrowRightIcon,
  CrownIcon,
  ShieldIcon,
  UserIcon,
  EyeIcon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Organization } from "@/hooks/use-organization"

type OrganizationSwitcherProps = {
  organizations: Organization[]
  activeOrganizationId: string | null
  onSwitch: (orgId: string) => Promise<void>
}

const ROLE_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "ghost"; icon: React.ElementType }
> = {
  owner: {
    label: "Owner",
    variant: "default",
    icon: CrownIcon,
  },
  admin: {
    label: "Admin",
    variant: "secondary",
    icon: ShieldIcon,
  },
  member: {
    label: "Member",
    variant: "outline",
    icon: UserIcon,
  },
  viewer: {
    label: "Viewer",
    variant: "ghost",
    icon: EyeIcon,
  },
}

function getRoleConfig(role: string) {
  return ROLE_CONFIG[role] ?? ROLE_CONFIG.member
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Deterministic gradient based on name string
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-indigo-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-fuchsia-500 to-purple-600",
    "from-sky-500 to-blue-600",
    "from-lime-500 to-green-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
  onSwitch,
}: OrganizationSwitcherProps) {
  const hasMultiple = organizations.length > 1

  return (
    <div className="flex flex-col gap-2">
      {hasMultiple && (
        <p className="text-xs text-muted-foreground font-medium">
          Your organizations
        </p>
      )}
      <div
        className={cn(
          "grid gap-2",
          hasMultiple ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}
      >
        {organizations.map((org) => {
          const isActive = org.id === activeOrganizationId
          const role = getRoleConfig(org.role)
          const RoleIcon = role.icon

          return (
            <div
              key={org.id}
              className={cn(
                "group relative rounded-lg ring-1 transition-all",
                isActive
                  ? "bg-primary/5 ring-primary/20"
                  : "bg-card ring-foreground/10 hover:ring-foreground/20 hover:bg-muted/30"
              )}
            >
              <button
                onClick={() => {
                  if (!isActive) onSwitch(org.id)
                }}
                className={cn(
                  "flex w-full items-start gap-3 p-3 text-left",
                  !isActive && hasMultiple && "cursor-pointer"
                )}
              >
                {/* Organization Avatar */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white text-xs font-bold",
                    getAvatarGradient(org.name)
                  )}
                >
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt=""
                      className="size-full rounded-lg object-cover"
                    />
                  ) : (
                    getInitials(org.name)
                  )}
                </div>

                {/* Org Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {org.name}
                    </span>
                    {isActive && (
                      <CheckIcon className="size-3.5 shrink-0 text-primary" weight="bold" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant={role.variant} className="gap-0.5">
                      <RoleIcon className="size-2.5" />
                      {role.label}
                    </Badge>
                  </div>
                </div>
              </button>

              {/* Manage link */}
              <div className="px-3 pb-2.5">
                <Link
                  href={`/dashboard/organizations/${org.id}`}
                  className="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground transition-colors hover:text-primary"
                >
                  Manage
                  <ArrowRightIcon className="size-2.5" />
                </Link>
              </div>

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Single org info display (no switching needed)
export function OrganizationInfoCard({
  organization,
}: {
  organization: Organization
}) {
  const role = getRoleConfig(organization.role)
  const RoleIcon = role.icon

  return (
    <div className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white text-xs font-bold",
          getAvatarGradient(organization.name)
        )}
      >
        {organization.logo ? (
          <img
            src={organization.logo}
            alt=""
            className="size-full rounded-lg object-cover"
          />
        ) : (
          getInitials(organization.name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {organization.name}
          </span>
          <Badge variant={role.variant} className="gap-0.5 shrink-0">
            <RoleIcon className="size-2.5" />
            {role.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground font-mono">
          {organization.slug}
        </p>
      </div>
    </div>
  )
}
