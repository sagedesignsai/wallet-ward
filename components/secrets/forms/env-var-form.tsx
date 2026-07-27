"use client"

import { useState, useCallback } from "react"
import { SparkleIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SecretFormProps } from "./types"

export function EnvVarForm({
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
  const [showValue, setShowValue] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Variable name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!value) {
      newErrors.value = "Value is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, value])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      await onSubmit({
        name: name.trim(),
        value,
        description: description.trim() || undefined,
        type: "env_var",
      })
    },
    [name, value, description, validate, onSubmit]
  )

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase()
    setName(newValue)
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/20">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <SparkleIcon className="mr-1 inline size-3" />
          Environment variables are typically UPPERCASE with underscores (e.g.,
          DATABASE_URL, API_KEY)
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="env-name">
          Variable Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="env-name"
          placeholder="DATABASE_URL"
          value={name}
          onChange={handleNameChange}
          autoFocus
          className="font-mono"
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "env-name-error" : undefined}
        />
        {errors.name && (
          <p id="env-name-error" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
        <p className="text-[0.625rem] text-muted-foreground">
          Use uppercase with underscores for consistency
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="env-value">
          Value <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="env-value"
            type={showValue ? "text" : "password"}
            placeholder="Enter the variable value"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (errors.value) {
                setErrors((prev) => ({ ...prev, value: "" }))
              }
            }}
            className="pr-10 font-mono"
            disabled={isSubmitting}
            aria-invalid={!!errors.value}
            aria-describedby={errors.value ? "env-value-error" : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowValue((s) => !s)}
            tabIndex={-1}
            aria-label={showValue ? "Hide value" : "Show value"}
          >
            {showValue ? (
              <EyeSlashIcon className="size-3.5" />
            ) : (
              <EyeIcon className="size-3.5" />
            )}
          </Button>
        </div>
        {errors.value && (
          <p id="env-value-error" className="text-xs text-destructive">
            {errors.value}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="env-description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="env-description"
          placeholder="Brief description of this variable's purpose..."
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
            "Create Variable"
          )}
        </Button>
      </div>
    </form>
  )
}
