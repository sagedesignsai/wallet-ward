"use client"

import { useState, useCallback } from "react"
import { NoteIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SecretFormProps } from "./types"

export function NoteForm({
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

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Note name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!value.trim()) {
      newErrors.value = "Note content is required"
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
        type: "note",
      })
    },
    [name, value, description, validate, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20 px-3 py-2">
        <p className="text-xs text-gray-900 dark:text-gray-100">
          <NoteIcon className="inline size-3 mr-1" />
          Store sensitive documentation, recovery codes, instructions, or any
          text-based information that needs to be kept secure.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note-name">
          Note Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="note-name"
          placeholder="e.g., recovery_codes, setup_instructions"
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
        <Label htmlFor="note-value">
          Content <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="note-value"
          placeholder="Enter your note content here...

You can use this to store:
• Recovery codes
• Security questions and answers
• Setup instructions
• Important documentation
• Any sensitive text information"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (errors.value) {
              setErrors((prev) => ({ ...prev, value: "" }))
            }
          }}
          className="text-sm resize-none"
          rows={12}
          disabled={isSubmitting}
          aria-invalid={!!errors.value}
        />
        {errors.value && (
          <p className="text-xs text-destructive">{errors.value}</p>
        )}
        <div className="flex items-center justify-between text-[0.625rem] text-muted-foreground">
          <span>Supports plain text and markdown formatting</span>
          <span>{value.length} characters</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note-description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="note-description"
          placeholder="Brief summary of this note..."
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
            "Create Note"
          )}
        </Button>
      </div>
    </form>
  )
}
