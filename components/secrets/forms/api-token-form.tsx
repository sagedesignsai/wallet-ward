"use client"

import { useState, useCallback } from "react"
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CopyIcon,
  CheckIcon,
  CalendarIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SecretFormProps } from "./types"

export function ApiTokenForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialValues,
}: SecretFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [value, setValue] = useState(initialValues?.value ?? "")
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  )
  const [expiresAt, setExpiresAt] = useState("")
  const [scopes, setScopes] = useState("")
  const [showValue, setShowValue] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Token name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!value) {
      newErrors.value = "Token value is required"
    }

    if (expiresAt) {
      const expiry = new Date(expiresAt)
      if (isNaN(expiry.getTime())) {
        newErrors.expiresAt = "Invalid date format"
      } else if (expiry < new Date()) {
        newErrors.expiresAt = "Expiry date must be in the future"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, value, expiresAt])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      const metadata: Record<string, unknown> = {}
      if (expiresAt) {
        metadata.expiresAt = new Date(expiresAt).toISOString()
      }
      if (scopes.trim()) {
        metadata.scopes = scopes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      }

      await onSubmit({
        name: name.trim(),
        value,
        description: description.trim() || undefined,
        type: "api_token",
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })
    },
    [name, value, description, expiresAt, scopes, validate, onSubmit]
  )

  const handleCopy = useCallback(async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [value])

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/20">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <ShieldCheckIcon className="mr-1 inline size-3" />
          Store API tokens, access keys, and bearer tokens securely. Add expiry
          dates and scopes for better management.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="token-name">
          Token Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="token-name"
          placeholder="e.g., github_api_token, stripe_key"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }))
            }
          }}
          autoFocus
          className="font-mono"
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="token-value">
          Token Value <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Textarea
            id="token-value"
            placeholder="Paste your API token here..."
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (errors.value) {
                setErrors((prev) => ({ ...prev, value: "" }))
              }
            }}
            className="resize-none pr-20 font-mono text-xs"
            rows={4}
            disabled={isSubmitting}
            aria-invalid={!!errors.value}
          />
          <div className="absolute top-2 right-2 flex gap-0.5">
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                tabIndex={-1}
                aria-label="Copy token"
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-green-600" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowValue((s) => !s)}
              tabIndex={-1}
              aria-label={showValue ? "Hide token" : "Show token"}
            >
              {showValue ? (
                <EyeSlashIcon className="size-3.5" />
              ) : (
                <EyeIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
        {errors.value && (
          <p className="text-xs text-destructive">{errors.value}</p>
        )}
        {!showValue && value && (
          <p className="text-[0.625rem] text-muted-foreground">
            Token is hidden. Click the eye icon to reveal.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="token-expires">
            Expires On{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <div className="relative">
            <Input
              id="token-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => {
                setExpiresAt(e.target.value)
                if (errors.expiresAt) {
                  setErrors((prev) => ({ ...prev, expiresAt: "" }))
                }
              }}
              disabled={isSubmitting}
              aria-invalid={!!errors.expiresAt}
              min={new Date().toISOString().split("T")[0]}
            />
            <CalendarIcon className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          {errors.expiresAt && (
            <p className="text-xs text-destructive">{errors.expiresAt}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="token-scopes">
            Scopes{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id="token-scopes"
            placeholder="read, write, admin"
            value={scopes}
            onChange={(e) => setScopes(e.target.value)}
            disabled={isSubmitting}
            className="text-xs"
          />
          <p className="text-[0.625rem] text-muted-foreground">
            Comma-separated list of permissions
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="token-description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="token-description"
          placeholder="What service is this token for? What can it access?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="resize-none text-xs"
        />
      </div>

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
              Creating...
            </>
          ) : (
            "Create Token"
          )}
        </Button>
      </div>
    </form>
  )
}
