"use client"

import { useState, useCallback, useMemo } from "react"
import {
  LockKeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CopyIcon,
  SparkleIcon,
  CheckIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { SecretFormProps } from "./types"

type PasswordStrength = {
  score: number // 0-4
  label: string
  color: string
}

function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Too weak", color: "bg-gray-300" }
  }

  let score = 0

  // Length
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Cap at 4
  score = Math.min(4, score)

  const strengths = [
    { score: 0, label: "Too weak", color: "bg-red-500" },
    { score: 1, label: "Weak", color: "bg-orange-500" },
    { score: 2, label: "Fair", color: "bg-yellow-500" },
    { score: 3, label: "Good", color: "bg-blue-500" },
    { score: 4, label: "Strong", color: "bg-green-500" },
  ]

  return strengths[score]
}

function generatePassword(length: number = 20): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
  const all = lowercase + uppercase + numbers + symbols

  let password = ""
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

export function PasswordForm({
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
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const strength = useMemo(() => calculatePasswordStrength(value), [value])

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Password name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!value) {
      newErrors.value = "Password is required"
    } else if (value.length < 8) {
      newErrors.value = "Password should be at least 8 characters"
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
        type: "password",
        metadata: {
          strength: strength.label,
        },
      })
    },
    [name, value, description, strength, validate, onSubmit]
  )

  const handleGenerate = useCallback(() => {
    const newPassword = generatePassword(20)
    setValue(newPassword)
    setShowValue(true)
    if (errors.value) {
      setErrors((prev) => ({ ...prev, value: "" }))
    }
  }, [errors.value])

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
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 px-3 py-2">
        <p className="text-xs text-amber-900 dark:text-amber-100">
          <LockKeyIcon className="inline size-3 mr-1" />
          Use strong, unique passwords. Consider using the generator for maximum
          security.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password-name">
          Password Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="password-name"
          placeholder="e.g., admin_password, api_secret"
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
        <Label htmlFor="password-value">
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password-value"
            type={showValue ? "text" : "password"}
            placeholder="Enter or generate a password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (errors.value) {
                setErrors((prev) => ({ ...prev, value: "" }))
              }
            }}
            className="pr-20 font-mono"
            disabled={isSubmitting}
            aria-invalid={!!errors.value}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                tabIndex={-1}
                aria-label="Copy password"
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
              aria-label={showValue ? "Hide password" : "Show password"}
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

        {value && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Strength:</span>
              <span
                className={cn(
                  "font-medium",
                  strength.score <= 1 && "text-red-600",
                  strength.score === 2 && "text-yellow-600",
                  strength.score === 3 && "text-blue-600",
                  strength.score === 4 && "text-green-600"
                )}
              >
                {strength.label}
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i < strength.score ? strength.color : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={isSubmitting}
          className="w-fit"
        >
          <SparkleIcon className="size-3.5" />
          Generate Strong Password
        </Button>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password-description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="password-description"
          placeholder="What is this password used for?"
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
            "Create Password"
          )}
        </Button>
      </div>
    </form>
  )
}
