"use client"

import React, { useEffect, useMemo, useState, useCallback, use } from "react"
import {
  UsersIcon,
  UsersThreeIcon,
  EnvelopeSimpleIcon,
  UserPlusIcon,
  CrownIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon,
  XIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useOrgDetail } from "@/hooks/use-org-detail"
import { useAuth } from "@/hooks/use-auth"
import { useMembers, type Member, type Invitation } from "@/hooks/use-members"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/data-table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { InviteMemberForm } from "@/components/organizations/invite-member-form"
import { MemberRowActions } from "@/components/organizations/member-row-actions"

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
      {member.user.image && <AvatarImage src={member.user.image} alt={name} />}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br text-[0.625rem] font-bold text-white",
          getAvatarGradient(name)
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

// --- Invitation Row ---

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
          <Badge variant={role.variant} className="shrink-0 gap-0.5">
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

// --- Section Header ---

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

// --- Page ---

export default function OrgMembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = use(params)
  return <OrgMembersInner orgId={orgId} />
}

function OrgMembersInner({ orgId }: { orgId: string }) {
  const { setConfig } = useDashboardConfig()
  const { user } = useAuth()
  const { organization, isLoading: orgLoading } = useOrgDetail(orgId)

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
  } = useMembers(orgId)

  useEffect(() => {
    if (organization) {
      setConfig({
        title: "Members",
        description: `Manage team members for ${organization.name}`,
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Organizations", href: "/dashboard/organizations" },
          {
            label: organization.name,
            href: `/dashboard/organizations/${orgId}`,
          },
          { label: "Members" },
        ],
      })
    }
  }, [organization, orgId, setConfig])

  const isOwnerOrAdmin = useMemo(() => {
    if (!user?.id || members.length === 0) return false
    const currentMember = members.find((m) => m.userId === user.id)
    return currentMember?.role === "owner" || currentMember?.role === "admin"
  }, [members, user?.id])

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
  const memberColumns: DataTableColumn<Member & Record<string, unknown>>[] =
    useMemo(
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
                  <span className="block truncate text-[0.625rem] text-muted-foreground">
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

  // Loading state
  if (orgLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex animate-in flex-col gap-5 duration-300 fade-in">
      {/* Error banner */}
      {membersError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {membersError}
          <button
            onClick={refetchMembers}
            className="ml-2 font-medium underline underline-offset-2 transition-colors hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Invite Form */}
      {isOwnerOrAdmin && (
        <div className="flex flex-col gap-3">
          <SectionHeader icon={<UserPlusIcon />} title="Invite Member">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                document.getElementById("invite-email")?.focus()
              }}
              className="hidden sm:flex"
            >
              <UserPlusIcon />
              Invite Member
            </Button>
          </SectionHeader>

          <Card
            size="sm"
            className="border-dashed border-primary/20 bg-primary/[0.02]"
          >
            <CardContent className="pt-0">
              <InviteMemberForm onInvite={invite} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members Table */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          icon={<UsersIcon />}
          title="Members"
          count={members.length}
        />
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
      </div>

      {/* Invitations Section */}
      {invitations.length > 0 && (
        <div className="mt-1 flex flex-col gap-2.5">
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
  )
}
