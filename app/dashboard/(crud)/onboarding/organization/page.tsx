"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "nextjs-toploader/app"
import { BuildingsIcon, ArrowLeftIcon } from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useOrganization } from "@/hooks/use-organization"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function OrganizationOnboardingPage() {
  const { setConfig } = useDashboardConfig()
  const router = useRouter()
  const { createOrganization } = useOrganization()

  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)

  useEffect(() => {
    setConfig({
      title: "",
      description: "",
      breadcrumbs: [],
    })
  }, [setConfig])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmed = name.trim()
      if (!trimmed) {
        setError("Organization name is required.")
        return
      }
      if (trimmed.length > 100) {
        setError("Organization name must be 100 characters or fewer.")
        return
      }

      setIsSubmitting(true)
      setError(null)

      const org = await createOrganization({ name: trimmed })

      if (org) {
        router.push("/dashboard/onboarding/project")
      } else {
        setError("Failed to create organization. Please try again.")
        setIsSubmitting(false)
      }
    },
    [name, createOrganization, router]
  )

  const handleSkip = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-lg">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            1
          </div>
          <div className="h-1 flex-1 rounded-full bg-border/40" />
          <div className="flex size-8 items-center justify-center rounded-full bg-muted/40 text-xs font-medium text-muted-foreground">
            2
          </div>
          <p className="text-xs text-muted-foreground">Step 1 of 2</p>
        </div>

        <Card className="border border-border/40">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BuildingsIcon className="size-5" weight="duotone" />
              </div>
              <div>
                <CardTitle>Create Organization</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your organization is the security boundary for your team
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="e.g. Acme Corp, My Team"
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

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <span className="font-medium">Tip:</span> Organizations can have multiple members and projects. You'll become the owner.
                </p>
              </div>
            </form>
          </CardContent>

          <CardFooter className="border-t border-border/40 gap-2">
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
              className="flex-1 gap-2 shadow-sm shadow-primary/10 transition-shadow hover:shadow-md hover:shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <BuildingsIcon className="size-4" />
                  Create Organization
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
            onClick={() => router.push("/dashboard/onboarding")}
          >
            <ArrowLeftIcon className="size-3" />
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}
