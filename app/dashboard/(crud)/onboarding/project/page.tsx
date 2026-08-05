"use client"

import { useState, useCallback } from "react"
import { useRouter } from "nextjs-toploader/app"
import { FolderPlusIcon, ArrowLeftIcon } from "@phosphor-icons/react"

import { useDashboardConfigStore } from "@/stores/dashboard-config"
import { useProjects } from "@/hooks/use-projects"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function ProjectOnboardingPage() {
  const router = useRouter()
  const { createProject } = useProjects()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)

  useDashboardConfigStore.setState({
    title: "",
    description: "",
    breadcrumbs: [],
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmed = name.trim()
      if (!trimmed) {
        setError("Project name is required.")
        return
      }
      if (trimmed.length > 100) {
        setError("Project name must be 100 characters or fewer.")
        return
      }

      setIsSubmitting(true)
      setError(null)

      const project = await createProject({
        name: trimmed,
        slug: slug || undefined,
        description: description.trim() || undefined,
      })

      if (project) {
        router.push("/dashboard/onboarding/complete")
      } else {
        setError("Failed to create project. Please try again.")
        setIsSubmitting(false)
      }
    },
    [name, description, slug, createProject, router]
  )

  const handleSkip = () => {
    router.push("/dashboard/onboarding/complete")
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-lg">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted/40 text-xs font-medium text-muted-foreground">
            1
          </div>
          <div className="h-1 flex-1 rounded-full bg-primary/30" />
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            2
          </div>
          <p className="text-xs text-muted-foreground">Step 2 of 2</p>
        </div>

        <Card className="border border-border/40">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <FolderPlusIcon className="size-5" weight="duotone" />
              </div>
              <div>
                <CardTitle>Create Your First Project</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Projects organize your secrets and environments
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g. My App, API Backend"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError(null)
                  }}
                  autoFocus
                  maxLength={100}
                  disabled={isSubmitting}
                  className="text-base"
                />
                {slug && (
                  <p className="text-xs text-muted-foreground">
                    Slug:{" "}
                    <span className="font-mono font-medium text-foreground/70">
                      {slug}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="project-description">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="project-description"
                  placeholder="Brief description of this project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <span className="font-medium">Tip:</span> Each project can
                  have multiple environments (dev, staging, production) with
                  separate secrets.
                </p>
              </div>
            </form>
          </CardContent>

          <CardFooter className="gap-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="flex-1 gap-2 shadow-sm shadow-violet-500/10 transition-shadow hover:shadow-md hover:shadow-violet-500/20"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlusIcon className="size-4" />
                  Create Project
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => router.push("/dashboard/onboarding/organization")}
          >
            <ArrowLeftIcon className="size-3" />
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
