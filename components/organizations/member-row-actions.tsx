"use client"

import { useState, useCallback } from "react"
import {
  DotsThreeVerticalIcon,
  ArrowsClockwiseIcon,
  UserMinusIcon,
} from "@phosphor-icons/react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Member } from "@/hooks/use-members"

type MemberRowActionsProps = {
  member: Member
  onUpdateRole: (memberId: string, role: string) => Promise<boolean>
  onRemove: (memberId: string) => Promise<boolean>
  isCurrentUser: boolean
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
}

const ROLE_OPTIONS = ["admin", "member", "viewer"]

export function MemberRowActions({
  member,
  onUpdateRole,
  onRemove,
  isCurrentUser,
}: MemberRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleRemove = useCallback(async () => {
    await onRemove(member.id)
    setMenuOpen(false)
  }, [member.id, onRemove])

  const handleChangeRole = useCallback(
    async (role: string) => {
      await onUpdateRole(member.id, role)
      setMenuOpen(false)
    },
    [member.id, onUpdateRole]
  )

  const canManage = !isCurrentUser && member.role !== "owner"
  if (!canManage) return null

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThreeVerticalIcon />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowsClockwiseIcon />
            Change Role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>
              Role for {member.user.name || member.user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLE_OPTIONS.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation()
                  handleChangeRole(role)
                }}
                className={member.role === role ? "font-medium" : ""}
              >
                <span className={member.role === role ? "text-primary" : ""}>
                  {ROLE_LABELS[role]}
                </span>
                {member.role === role && (
                  <span className="ml-auto text-[0.625rem] text-primary">
                    Current
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <ConfirmDialog
          trigger={
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <UserMinusIcon />
              Remove from Organization
            </DropdownMenuItem>
          }
          title="Remove team member"
          description={`Are you sure you want to remove ${member.user.name || member.user.email}? They will lose access to all organization resources.`}
          confirmLabel="Remove"
          variant="destructive"
          onConfirm={handleRemove}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
