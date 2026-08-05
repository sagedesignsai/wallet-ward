"use client"

import { useState, useEffect, useCallback } from "react"
import {
  GithubLogoIcon,
  GitlabLogoIcon,
  CodeIcon,
  LinkIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
} from "@phosphor-icons/react"
import type { RepositoryProvider, RepositoryAccessType } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RepositoryFormProps } from "./types"

const PROVIDER_OPTIONS: {
  value: RepositoryProvider
  label: string
  icon: typeof GithubLogoIcon
  color: string
}[] = [
  {
    value: "github",
    label: "GitHub",
    icon: GithubLogoIcon,
    color: "text-gray-900 dark:text-gray-100",
  },
  {
    value: "gitlab",
    label: "GitLab",
    icon: GitlabLogoIcon,
    color: "text-orange-500",
  },
  {
    value: "bitbucket",
    label: "Bitbucket",
    icon: CodeIcon,
    color: "text-blue-500",
  },
  {
    value: "custom",
    label: "Custom",
    icon: CodeIcon,
    color: "text-muted-foreground",
  },
]

export function RepositoryForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialValues,
  isEditing: isEditingProp,
}: RepositoryFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [url, setUrl] = useState(initialValues?.url ?? "")
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  )
  const [provider, setProvider] = useState<RepositoryProvider>(
    initialValues?.provider ?? "github"
  )
  const [branch, setBranch] = useState(initialValues?.branch ?? "main")
  const [accessType, setAccessType] = useState<RepositoryAccessType>(
    initialValues?.accessType ?? "private"
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync form state when `initialValues` change after mount (e.g. a repository
  // picked from the GitHub import dialog pre-fills the form).
  useEffect(() => {
    if (!initialValues) return
    if (initialValues.name !== undefined) setName(initialValues.name)
    if (initialValues.url !== undefined) setUrl(initialValues.url)
    if (initialValues.description !== undefined)
      setDescription(initialValues.description)
    if (initialValues.provider !== undefined)
      setProvider(initialValues.provider)
    if (initialValues.branch !== undefined) setBranch(initialValues.branch)
    if (initialValues.accessType !== undefined)
      setAccessType(initialValues.accessType)
    setErrors({})
  }, [initialValues])

  const isEditing = isEditingProp ?? !!initialValues?.url

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Repository name is required"
    }

    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      newErrors.url = "Repository URL is required"
    } else if (!/^https?:\/\/.+/.test(trimmedUrl)) {
      newErrors.url = "URL must start with http:// or https://"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, url])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      await onSubmit({
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        provider,
        branch: branch.trim() || undefined,
        accessType,
      })
    },
    [name, url, description, provider, branch, accessType, validate, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Provider Info Banner */}
      <div className="rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2 dark:border-purple-900 dark:bg-purple-950/20">
        <p className="text-xs text-purple-900 dark:text-purple-100">
          <LinkIcon className="mr-1 inline size-3" />
          Connect your Git repository to sync code, manage deployments, and
          track changes across your project.
        </p>
      </div>

      {/* Repository Name */}
      <div className="grid gap-2">
        <Label htmlFor="repo-name">
          Repository Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="repo-name"
          placeholder="my-project-repo"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }))
            }
          }}
          autoFocus
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "repo-name-error" : undefined}
        />
        {errors.name && (
          <p id="repo-name-error" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      {/* Repository URL */}
      <div className="grid gap-2">
        <Label htmlFor="repo-url">
          Repository URL <span className="text-destructive">*</span>
        </Label>
        <Input
          id="repo-url"
          placeholder="https://github.com/org/repo"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            if (errors.url) {
              setErrors((prev) => ({ ...prev, url: "" }))
            }
          }}
          disabled={isSubmitting}
          className="font-mono text-xs"
          aria-invalid={!!errors.url}
          aria-describedby={errors.url ? "repo-url-error" : undefined}
        />
        {errors.url && (
          <p id="repo-url-error" className="text-xs text-destructive">
            {errors.url}
          </p>
        )}
        <p className="text-[0.625rem] text-muted-foreground">
          Full HTTPS URL to the Git repository
        </p>
      </div>

      {/* Provider */}
      <div className="grid gap-2">
        <Label htmlFor="repo-provider">
          Provider <span className="text-destructive">*</span>
        </Label>
        <Select
          value={provider}
          onValueChange={(v: string) => setProvider(v as RepositoryProvider)}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="repo-provider"
            className="w-full"
            aria-describedby="repo-provider-hint"
          >
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <Icon className={`size-3.5 ${opt.color}`} weight="fill" />
                    {opt.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <p
          id="repo-provider-hint"
          className="text-[0.625rem] text-muted-foreground"
        >
          Where the repository is hosted
        </p>
      </div>

      {/* Default Branch */}
      <div className="grid gap-2">
        <Label htmlFor="repo-branch">
          Default Branch{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="repo-branch"
          placeholder="main"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          disabled={isSubmitting}
          className="font-mono"
        />
        <p className="text-[0.625rem] text-muted-foreground">
          Defaults to &quot;main&quot; if not specified
        </p>
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="repo-description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="repo-description"
          placeholder="Brief description of this repository..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="resize-none text-xs"
        />
      </div>

      {/* Access Type */}
      <div className="grid gap-2">
        <Label>
          Visibility <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={accessType === "private" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setAccessType("private")}
            disabled={isSubmitting}
          >
            <LockKeyIcon className="size-3.5" />
            Private
          </Button>
          <Button
            type="button"
            variant={accessType === "public" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setAccessType("public")}
            disabled={isSubmitting}
          >
            <LockKeyOpenIcon className="size-3.5" />
            Public
          </Button>
        </div>
        <p className="text-[0.625rem] text-muted-foreground">
          {accessType === "private"
            ? "Only project members can access this repository"
            : "Anyone with the link can view this repository"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {isEditing ? "Saving..." : "Connecting..."}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Connect Repository"
          )}
        </Button>
      </div>
    </form>
  )
}
