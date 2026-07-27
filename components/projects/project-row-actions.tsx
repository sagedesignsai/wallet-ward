"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Project } from "@/hooks/use-projects"

type ProjectRowActionsProps = {
  project: Project
  onDelete: (id: string) => Promise<boolean>
}

export function ProjectRowActions({
  project,
  onDelete,
}: ProjectRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleDelete = useCallback(async () => {
    await onDelete(project.id)
    setMenuOpen(false)
  }, [project.id, onDelete])

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
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/projects/${project.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowRightIcon />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <PencilSimpleIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ConfirmDialog
          trigger={
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e: React.MouseEvent<HTMLDivElement>) =>
                e.preventDefault()
              }
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                e.stopPropagation()
              }
            >
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          }
          title="Delete project"
          description={`Are you sure you want to delete "${project.name}"? This will permanently remove all environments and secrets in this project.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
