"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  BuildingsIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useOrganization } from "@/hooks/use-organization"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
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

export default function NewOrganizationPage() {
  const { setConfig } = useDashboardConfig()
  const router = useRouter()
  const { createOrganization } = useOrganization()

  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)

  useEffect(() => {
    setConfig({
      title: "New Organization",
      description: "Create a new organization for your team",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Organizations", href: "/dashboard/organizations" },
        { label: "New" },
      ],
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
        router.push("/dashboard/organizations")
      } else {
        setError("Failed to create organization. Please try again.")
        setIsSubmitting(false)
      }
    },
    [name, createOrganization, router]
  )

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => router.push("/dashboard/organizations")}
      >
        <ArrowLeftIcon />
        Back to Organizations
      </Button>

      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Icon */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary ring-1 ring-primary/10">
                  <BuildingsIcon className="size-5" weight="light" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Create Organization
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Set up a workspace for your team
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="e.g. Acme Corp"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError(null)
                  }}
                  autoFocus
                  maxLength={100}
                  disabled={isSubmitting}
                />
                {slug && (
                  <p className="text-[0.625rem] text-muted-foreground">
                    Slug:{" "}
                    <span className="font-mono text-foreground/70">{slug}</span>
                  </p>
                )}
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </form>
          </CardContent>
          <CardFooter className="border-t border-border/40">
            <div className="flex w-full items-center justify-between">
              <p className="text-[0.625rem] text-muted-foreground">
                You will become the organization owner.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/organizations")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!name.trim() || isSubmitting}
                  className="shadow-sm shadow-primary/10 transition-shadow hover:shadow-md hover:shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <BuildingsIcon />
                      Create Organization
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
