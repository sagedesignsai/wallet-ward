"use client"

import { useState, useCallback, useMemo } from "react"
import {
  FileJsIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  SparkleIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SecretFormProps } from "./types"

export function JsonForm({
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const jsonValidation = useMemo(() => {
    if (!value.trim()) return null

    try {
      const parsed = JSON.parse(value)
      return {
        valid: true,
        message: "Valid JSON",
        keys: Object.keys(parsed).length,
      }
    } catch (err) {
      return {
        valid: false,
        message: err instanceof Error ? err.message : "Invalid JSON",
      }
    }
  }, [value])

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!value.trim()) {
      newErrors.value = "JSON content is required"
    } else {
      try {
        JSON.parse(value)
      } catch {
        newErrors.value = "Invalid JSON syntax"
      }
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
        value: value.trim(),
        description: description.trim() || undefined,
        type: "json",
      })
    },
    [name, value, description, validate, onSubmit]
  )

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(value)
      const formatted = JSON.stringify(parsed, null, 2)
      setValue(formatted)
      if (errors.value) {
        setErrors((prev) => ({ ...prev, value: "" }))
      }
    } catch {
      // Ignore formatting errors
    }
  }, [value, errors.value])

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 dark:border-indigo-900 dark:bg-indigo-950/20">
        <p className="text-xs text-indigo-900 dark:text-indigo-100">
          <FileJsIcon className="mr-1 inline size-3" />
          Store JSON configuration files, service account keys, or structured
          data securely.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="json-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="json-name"
          placeholder="e.g., firebase_config, service_account"
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
        <div className="flex items-center justify-between">
          <Label htmlFor="json-value">
            JSON Content <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            {jsonValidation && (
              <div className="flex items-center gap-1 text-xs">
                {jsonValidation.valid ? (
                  <>
                    <CheckCircleIcon className="size-3 text-green-600" />
                    <span className="text-green-600">
                      {jsonValidation.message}
                      {jsonValidation.keys !== undefined &&
                        ` (${jsonValidation.keys} keys)`}
                    </span>
                  </>
                ) : (
                  <>
                    <WarningCircleIcon className="size-3 text-amber-600" />
                    <span className="text-amber-600">
                      {jsonValidation.message}
                    </span>
                  </>
                )}
              </div>
            )}
            {value && jsonValidation?.valid && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFormat}
                disabled={isSubmitting}
                className="h-6 text-xs"
              >
                <SparkleIcon className="size-3" />
                Format
              </Button>
            )}
          </div>
        </div>
        <Textarea
          id="json-value"
          placeholder={`{
  "apiKey": "...",
  "projectId": "...",
  "databaseURL": "..."
}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (errors.value) {
              setErrors((prev) => ({ ...prev, value: "" }))
            }
          }}
          className="resize-none font-mono text-xs"
          rows={12}
          disabled={isSubmitting}
          aria-invalid={!!errors.value}
          spellCheck={false}
        />
        {errors.value && (
          <p className="text-xs text-destructive">{errors.value}</p>
        )}
        <p className="text-[0.625rem] text-muted-foreground">
          Paste your JSON content. Use the Format button to prettify.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="json-description">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="json-description"
          placeholder="What is this JSON file used for?"
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
            "Create JSON Secret"
          )}
        </Button>
      </div>
    </form>
  )
}
