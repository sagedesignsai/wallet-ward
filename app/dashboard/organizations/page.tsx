"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  UsersIcon,
  UsersThreeIcon,
  EnvelopeSimpleIcon,
  BuildingsIcon,
  CrownIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon,
  XIcon,
  PlusIcon,
  UserPlusIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useAuth } from "@/hooks/use-auth"
import {
  useOrganization,
  type Organization,
} from "@/hooks/use-organization"
import { useMembers, type Member, type Invitation } from "@/hooks/use-members"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/data-table"
import { StatCard } from "@/components/dashboard/stat-card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  InviteMemberForm,
} from "@/components/organizations/invite-member-form"
import {
  MemberRowActions,
} from "@/components/organizations/member-row-actions"
import {
  OrganizationSwitcher,
} from "@/components/organizations/organization-switcher"

// --- Role helpers ---

type RoleConfig = {
  label: string
  variant: "default" | "secondary" | "outline" | "ghost"
  icon: React.ElementType
}

const ROLE_CONFIG: Record<string, RoleConfig> = {
  owner: { label: "Owner", variant: "default", icon: CrownIcon },
  admin: { label: "Admin", variant: "secondary", icon: ShieldCheckIcon },
  member: { label: "Member", variant: "outline", icon: UserIcon },
  viewer: { label: "Viewer", variant: "ghost", icon: EyeIcon },
}

function getRoleConfig(role: string): RoleConfig {
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

// Deterministic gradient from a name string
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

function MemberAvatar({ member }: { member: Member }) {
  const name = member.user.name || member.user.email
  return (
    <Avatar size="sm">
      {member.user.image && (
        <AvatarImage src={member.user.image} alt={name} />
      )}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br text-white text-[0.625rem] font-bold",
          getAvatarGradient(name)
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

// --- Sub-components ---

function SectionHeader({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-muted/50 text-muted-foreground [&_svg]:size-3">
          {icon}
        </div>
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-[0.625rem] text-muted-foreground tabular-nums">
            ({count})
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function InvitationRow({
  invitation,
  onCancel,
  canManage,
}: {
  invitation: Invitation
  onCancel: (id: string) => Promise<boolean>
  canManage: boolean
}) {
  const role = getRoleConfig(invitation.role)
  const RoleIcon = role.icon
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = useCallback(async () => {
    setIsCancelling(true)
    await onCancel(invitation.id)
  }, [invitation.id, onCancel])

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/30">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <EnvelopeSimpleIcon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-medium text-foreground">
            {invitation.email}
          </span>
          <Badge variant={role.variant} className="gap-0.5 shrink-0">
            <RoleIcon className="size-2.5" />
            {role.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
          Sent <TimeAgo date={invitation.createdAt} /> &middot; Expires{" "}
          <TimeAgo date={invitation.expiresAt} />
        </p>
      </div>
      {canManage && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          <XIcon />
          <span className="sr-only">Cancel invitation</span>
        </Button>
      )}
    </div>
  )
}

// --- Main Page ---

export default function OrganizationsPage() {
  const { setConfig } = useDashboardConfig()
  const { user } = useAuth()
  const {
    organizations,
    activeOrganizationId,
    activeOrganization,
    isLoading: orgLoading,
    error: orgError,
    switchOrganization,
    refetch: refetchOrgs,
  } = useOrganization()

  const {
    members,
    invitations,
    isLoading: membersLoading,
    error: membersError,
    invite,
    removeMember,
    updateRole,
    cancelInvitation,
    refetch: refetchMembers,
  } = useMembers(activeOrganizationId)

  const isOwnerOrAdmin = useMemo(() => {
    if (!activeOrganization) return false
    return (
      activeOrganization.role === "owner" ||
      activeOrganization.role === "admin"
    )
  }, [activeOrganization])

  useEffect(() => {
    setConfig({
      title: "Organizations",
      description: "Manage your team and permissions",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Organizations" },
      ],
      actions: (
        <Button
          size="default"
          asChild
          className="shadow-md shadow-primary/10 transition-shadow hover:shadow-lg hover:shadow-primary/20"
        >
          <Link href="/dashboard/organizations/new">
            <PlusIcon />
            New Organization
          </Link>
        </Button>
      ),
    })
  }, [setConfig])

  const handleSwitch = useCallback(
    async (orgId: string) => {
      await switchOrganization(orgId)
    },
    [switchOrganization]
  )

  const handleRoleChange = useCallback(
    async (memberId: string, role: string) => {
      return await updateRole(memberId, role)
    },
    [updateRole]
  )

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      return await removeMember(memberId)
    },
    [removeMember]
  )

  const handleCancelInvitation = useCallback(
    async (invitationId: string) => {
      return await cancelInvitation(invitationId)
    },
    [cancelInvitation]
  )

  // Member table columns
  const memberColumns: DataTableColumn<
    Member & Record<string, unknown>
  >[] = useMemo(
    () => [
      {
        key: "user",
        header: "Member",
        className: "w-[280px]",
        render: (row) => {
          const member = row as unknown as Member
          const name = member.user.name || member.user.email
          const isSelf = member.userId === user?.id
          return (
            <div className="flex items-center gap-2.5">
              <MemberAvatar member={member} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-foreground">
                    {name}
                  </span>
                  {isSelf && (
                    <span className="text-[0.625rem] text-muted-foreground italic">
                      (you)
                    </span>
                  )}
                </div>
                <span className="text-[0.625rem] text-muted-foreground truncate block">
                  {member.user.email}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        key: "role",
        header: "Role",
        className: "w-[100px]",
        render: (row) => {
          const member = row as unknown as Member
          const role = getRoleConfig(member.role)
          const RoleIcon = role.icon
          return (
            <Badge variant={role.variant} className="gap-0.5">
              <RoleIcon className="size-2.5" />
              {role.label}
            </Badge>
          )
        },
      },
      {
        key: "createdAt",
        header: "Joined",
        className: "w-[100px]",
        render: (row) => {
          const member = row as unknown as Member
          return <TimeAgo date={member.createdAt} />
        },
      },
      {
        key: "actions",
        header: "",
        className: "w-[40px] text-right",
        render: (row) => {
          const member = row as unknown as Member
          const isSelf = member.userId === user?.id
          if (!isOwnerOrAdmin || isSelf) return null
          return (
            <MemberRowActions
              member={member}
              onUpdateRole={handleRoleChange}
              onRemove={handleRemoveMember}
              isCurrentUser={isSelf}
            />
          )
        },
      },
    ],
    [isOwnerOrAdmin, user?.id, handleRoleChange, handleRemoveMember]
  )

  // --- Empty state: no organizations at all ---
  if (!orgLoading && organizations.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-6 py-16">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary ring-1 ring-primary/10 transition-transform hover:scale-105">
            <BuildingsIcon className="size-8" weight="light" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-foreground">
              No organizations yet
            </h3>
            <p className="mt-2 max-w-sm text-xs text-muted-foreground leading-relaxed">
              Create an organization to collaborate with your team, manage
              access permissions, and share secrets securely.
            </p>
          </div>
          <Button
            size="default"
            asChild
            className="shadow-md shadow-primary/10 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <Link href="/dashboard/organizations/new">
              <BuildingsIcon />
              Create Organization
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isLoading = orgLoading || membersLoading
  const error = orgError || membersError

  return (
    <div className="flex flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button
            onClick={() => {
              refetchOrgs()
              refetchMembers()
            }}
            className="ml-2 font-medium underline underline-offset-2 hover:text-destructive/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Organizations"
          value={orgLoading ? "—" : organizations.length}
          icon={<BuildingsIcon className="size-4" />}
          description={
            organizations.length === 1
              ? "1 organization"
              : `${organizations.length} organizations`
          }
        />
        <StatCard
          label="Team Members"
          value={isLoading ? "—" : members.length}
          icon={<UsersThreeIcon className="size-4" />}
          description={`In ${activeOrganization?.name ?? "active organization"}`}
        />
        <StatCard
          label="Pending Invitations"
          value={isLoading ? "—" : invitations.length}
          icon={<EnvelopeSimpleIcon className="size-4" />}
          description={
            invitations.length === 0
              ? "No pending invitations"
              : `${invitations.length} awaiting response`
          }
        />
      </div>

      {/* Organization Switcher */}
      <div className="flex flex-col gap-3">
        {organizations.length > 1 ? (
          <SectionHeader
            icon={<BuildingsIcon />}
            title="Organizations"
            count={organizations.length}
          />
        ) : (
          <SectionHeader
            icon={<BuildingsIcon />}
            title="Active Organization"
          />
        )}
        <OrganizationSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          onSwitch={handleSwitch}
        />
      </div>

      <Separator className="bg-border/40" />

      {/* Members Section */}
      {activeOrganization && (
        <div className="flex flex-col gap-3">
          {/* Members header + invite form row */}
          <div className="flex flex-col gap-3">
            <SectionHeader
              icon={<UsersIcon />}
              title="Members"
              count={members.length}
            >
              {isOwnerOrAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Focus the invite email input
                    document.getElementById("invite-email")?.focus()
                  }}
                  className="hidden sm:flex"
                >
                  <UserPlusIcon />
                  Invite Member
                </Button>
              )}
            </SectionHeader>

            {/* Invite form card (only for owners/admins) */}
            {isOwnerOrAdmin && (
              <Card size="sm" className="border-dashed border-primary/20 bg-primary/[0.02]">
                <CardContent className="pt-0">
                  <InviteMemberForm onInvite={invite} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Members Table */}
          <DataTable
            columns={memberColumns}
            data={members as (Member & Record<string, unknown>)[]}
            isLoading={membersLoading}
            loadingRows={3}
            keyExtractor={(m) => (m as unknown as Member).id}
            emptyTitle="No members"
            emptyDescription="Invite your team to collaborate on this organization."
            emptyIcon={<UsersThreeIcon />}
          />

          {/* Invitations Section */}
          {invitations.length > 0 && (
            <div className="flex flex-col gap-2.5 mt-1">
              <SectionHeader
                icon={<EnvelopeSimpleIcon />}
                title="Pending Invitations"
                count={invitations.length}
              />
              <div className="flex flex-col gap-1.5">
                {invitations.map((inv) => (
                  <InvitationRow
                    key={inv.id}
                    invitation={inv}
                    onCancel={handleCancelInvitation}
                    canManage={isOwnerOrAdmin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
