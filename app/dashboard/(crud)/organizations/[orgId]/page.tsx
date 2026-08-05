"use client"

import React, { use } from "react"
import Link from "next/link"
import {
  BuildingsIcon,
  UsersIcon,
  FolderIcon,
  ClipboardTextIcon,
  ArrowRightIcon,
  ClockCounterClockwiseIcon,
  GearIcon,
} from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useOrgDetail } from "@/hooks/use-org-detail"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// --- Avatar helpers ---

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

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

// --- Page ---

export default function OrgOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = use(params)

  return <OrgOverviewInner orgId={orgId} />
}

function OrgOverviewInner({ orgId }: { orgId: string }) {
  const { organization, isLoading, error } = useOrgDetail(orgId)

  if (organization) {
    useDashboardConfigStore.setState({
      title: organization.name,
      description: organization.slug,
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Organizations", href: "/dashboard/organizations" },
        { label: organization.name },
      ],
    })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-[140px] rounded-lg" />
          <Skeleton className="h-[140px] rounded-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-[120px] rounded-lg" />
          <Skeleton className="h-[120px] rounded-lg" />
          <Skeleton className="h-[120px] rounded-lg" />
        </div>
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <BuildingsIcon className="size-7" weight="light" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Organization not found
          </h3>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {error ??
              "This organization may have been deleted or you may not have access."}
          </p>
        </div>
        <Link
          href="/dashboard/organizations"
          className="text-xs text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
        >
          Back to Organizations
        </Link>
      </div>
    )
  }

  return (
    <div className="flex animate-in flex-col gap-5 duration-300 fade-in">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Top info row */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Organization Info Card */}
        <Card className="gap-0">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white",
                    getAvatarGradient(organization.name)
                  )}
                >
                  {organization.logo ? (
                    <img
                      src={organization.logo}
                      alt=""
                      className="size-full rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(organization.name)
                  )}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm">{organization.name}</CardTitle>
                  <span className="font-mono text-[0.625rem] text-muted-foreground">
                    {organization.slug}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center gap-4 text-[0.625rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ClockCounterClockwiseIcon className="size-3" />
                Created <TimeAgo date={organization.createdAt} />
              </span>
              <span className="flex items-center gap-1">
                Updated <TimeAgo date={organization.updatedAt} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Members stat */}
        <StatCard
          label="Members"
          value={organization.memberCount}
          icon={<UsersIcon className="size-4" />}
          description={
            organization.memberCount === 1
              ? "1 team member"
              : `${organization.memberCount} team members`
          }
        />
      </div>

      {/* Stats Row — Projects + Audit */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Projects"
          value={organization.projectCount}
          icon={<FolderIcon className="size-4" />}
          description={
            organization.projectCount === 1
              ? "1 project"
              : `${organization.projectCount} projects`
          }
        />
        <StatCard
          label="Audit Events"
          value={organization.auditLogCount}
          icon={<ClipboardTextIcon className="size-4" />}
          description={
            organization.auditLogCount === 0
              ? "No events recorded"
              : `${organization.auditLogCount} events tracked`
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-medium text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={`/dashboard/organizations/${orgId}/members`}
            className="group relative overflow-hidden rounded-lg border border-border/60 bg-card p-4 ring-1 ring-foreground/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:ring-foreground/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UsersIcon className="size-4" />
                </div>
                <h3 className="mt-2.5 text-sm font-medium text-foreground">
                  Manage Members
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Invite, remove, or change roles
                </p>
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </Link>

          <Link
            href={`/dashboard/organizations/${orgId}/settings`}
            className="group relative overflow-hidden rounded-lg border border-border/60 bg-card p-4 ring-1 ring-foreground/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:ring-foreground/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <GearIcon className="size-4" />
                </div>
                <h3 className="mt-2.5 text-sm font-medium text-foreground">
                  Organization Settings
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Name, logo, and preferences
                </p>
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </Link>

          <Link
            href="/dashboard/audit-logs"
            className="group relative overflow-hidden rounded-lg border border-border/60 bg-card p-4 ring-1 ring-foreground/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:ring-foreground/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <ClipboardTextIcon className="size-4" />
                </div>
                <h3 className="mt-2.5 text-sm font-medium text-foreground">
                  View Audit Logs
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Track activity and changes
                </p>
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
