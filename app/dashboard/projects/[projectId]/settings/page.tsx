"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import {
  GearIcon,
  WarningIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

type SettingsPageProps = {
  params: Promise<{ projectId: string }>
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { projectId } = use(params)

  return <SettingsInner projectId={projectId} />
}

function SettingsInner({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { setConfig } = useDashboardConfig()
  const { project, isLoading, error, refetch, updateProject, deleteProject } =
    useProject(projectId)

  // Edit form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete state
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync form with project data
  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description ?? "")
    }
  }, [project])

  useEffect(() => {
    if (project) {
      setConfig({
        description: `Configure ${project.name}`,
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          {
            label: project.name,
            href: `/dashboard/projects/${projectId}`,
          },
          { label: "Settings" },
        ],
      })
    }
  }, [project, projectId, setConfig])

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmedName = name.trim()
      if (!trimmedName) {
        setSaveError("Project name is required.")
        return
      }

      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      const result = await updateProject({
        name: trimmedName,
        description: description.trim() || null,
      })

      if (result) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setSaveError("Failed to save changes. Please try again.")
      }

      setIsSaving(false)
    },
    [name, description, updateProject]
  )

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    const success = await deleteProject()
    if (success) {
      router.push("/dashboard/projects")
    } else {
      setIsDeleting(false)
    }
  }, [deleteProject, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <Skeleton className="h-[150px] w-full rounded-lg" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Failed to load project
          </h3>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
            {error ?? "Project not found."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Edit Project Card */}
      <Card className="gap-0">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSave} className="grid gap-4 max-w-lg">
            <div className="grid gap-2">
              <Label htmlFor="settings-name">Name</Label>
              <Input
                id="settings-name"
                placeholder="Project name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (saveError) setSaveError(null)
                  if (saveSuccess) setSaveSuccess(false)
                }}
                disabled={isSaving}
                autoFocus
                maxLength={100}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="settings-description">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="settings-description"
                placeholder="Brief description of this project..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (saveSuccess) setSaveSuccess(false)
                }}
                disabled={isSaving}
                rows={3}
                className="resize-none text-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={
                  !name.trim() ||
                  isSaving ||
                  (name.trim() === project.name &&
                    (description.trim() || "") ===
                      (project.description ?? ""))
                }
              >
                {isSaving ? (
                  <>
                    <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>

              {saveSuccess && (
                <span className="text-xs text-green-600 dark:text-green-500 animate-in fade-in">
                  Changes saved
                </span>
              )}
              {saveError && (
                <span className="text-xs text-destructive">{saveError}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="gap-0 border-destructive/30">
        <CardHeader className="border-b border-destructive/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10">
              <WarningIcon className="size-3.5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-sm text-destructive">
                Danger Zone
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="max-w-lg">
            <h4 className="text-xs font-medium text-foreground">
              Delete Project
            </h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              This will permanently delete &ldquo;{project.name}&rdquo; and all
              of its environments, secrets, and version history. This action
              cannot be undone.
            </p>

            <div className="mt-4">
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="default">
                    Delete Project
                  </Button>
                }
                title="Delete this project?"
                description={`This will permanently delete "${project.name}" and all its environments, secrets, and version history. This action cannot be undone.`}
                confirmLabel="Delete Project"
                variant="destructive"
                onConfirm={handleDelete}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
