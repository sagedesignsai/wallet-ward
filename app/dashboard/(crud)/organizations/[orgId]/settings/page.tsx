"use client"

import { useEffect, useState, useCallback, use } from "react"
import {
  GearIcon,
  WarningIcon,
  CopyIcon,
  CheckIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useOrgDetail } from "@/hooks/use-org-detail"
import { DeleteOrgDialog } from "@/components/organizations/delete-org-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type SettingsPageProps = {
  params: Promise<{ orgId: string }>
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { orgId } = use(params)
  return <SettingsInner orgId={orgId} />
}

function SettingsInner({ orgId }: { orgId: string }) {
  const { setConfig } = useDashboardConfig()
  const {
    organization,
    isLoading,
    error,
    updateOrganization,
    deleteOrganization,
  } = useOrgDetail(orgId)

  // Edit form state
  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Slug copy state
  const [slugCopied, setSlugCopied] = useState(false)

  // Sync form with org data
  useEffect(() => {
    if (organization) {
      setName(organization.name)
      setLogoUrl(organization.logo ?? "")
    }
  }, [organization])

  useEffect(() => {
    if (organization) {
      setConfig({
        description: `Configure ${organization.name}`,
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Organizations", href: "/dashboard/organizations" },
          {
            label: organization.name,
            href: `/dashboard/organizations/${orgId}`,
          },
          { label: "Settings" },
        ],
      })
    }
  }, [organization, orgId, setConfig])

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmedName = name.trim()
      if (!trimmedName) {
        setSaveError("Organization name is required.")
        return
      }

      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      const result = await updateOrganization({
        name: trimmedName,
        logo: logoUrl.trim() || null,
      })

      if (result) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setSaveError("Failed to save changes. Please try again.")
      }

      setIsSaving(false)
    },
    [name, logoUrl, updateOrganization]
  )

  const handleCopySlug = useCallback(() => {
    if (!organization) return
    navigator.clipboard.writeText(organization.slug).then(() => {
      setSlugCopied(true)
      setTimeout(() => setSlugCopied(false), 2000)
    })
  }, [organization])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Failed to load organization
          </h3>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
            {error ?? "Organization not found."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex animate-in flex-col gap-5 duration-300 fade-in">
      {/* General Settings Card */}
      <Card className="gap-0">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm">Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSave} className="grid max-w-lg gap-4">
            <div className="grid gap-2">
              <Label htmlFor="settings-name">Name</Label>
              <Input
                id="settings-name"
                placeholder="Organization name"
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
              <Label>
                Slug{" "}
                <span className="font-normal text-muted-foreground">
                  (read-only)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-border/60 bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground select-all">
                  {organization.slug}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={handleCopySlug}
                  className="shrink-0"
                >
                  {slugCopied ? (
                    <CheckIcon className="size-3.5 text-green-600 dark:text-green-500" />
                  ) : (
                    <CopyIcon className="size-3.5" />
                  )}
                  <span className="sr-only">Copy slug</span>
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="settings-logo">
                Logo URL{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="settings-logo"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value)
                  if (saveSuccess) setSaveSuccess(false)
                }}
                disabled={isSaving}
                type="url"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={
                  !name.trim() ||
                  isSaving ||
                  (name.trim() === organization.name &&
                    (logoUrl.trim() || "") === (organization.logo ?? ""))
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
                <span className="animate-in text-xs text-green-600 fade-in dark:text-green-500">
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
              Delete Organization
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This will permanently delete &ldquo;{organization.name}&rdquo; and
              all its projects, environments, secrets, and audit logs. This
              action cannot be undone.
            </p>

            <div className="mt-4">
              <DeleteOrgDialog
                orgName={organization.name}
                onDelete={deleteOrganization}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
