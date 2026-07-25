"use client"

import { useState, useCallback, useMemo } from "react"
import {
  EyeIcon,
  EyeSlashIcon,
  LockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { useUserSettings } from "@/hooks/use-user-settings"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function getPasswordStrength(pw: string): {
  level: number
  label: string
  color: string
} {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 2) return { level: 1, label: "Weak", color: "bg-red-500" }
  if (score <= 3) return { level: 2, label: "Fair", color: "bg-orange-400" }
  if (score <= 4) return { level: 3, label: "Strong", color: "bg-green-400" }
  return { level: 4, label: "Very strong", color: "bg-green-500" }
}

const requirements = [
  { test: (pw: string) => pw.length >= 8, label: "At least 8 characters" },
  { test: (pw: string) => /[A-Z]/.test(pw), label: "One uppercase letter" },
  { test: (pw: string) => /[a-z]/.test(pw), label: "One lowercase letter" },
  { test: (pw: string) => /[0-9]/.test(pw), label: "One number" },
]

export function PasswordForm() {
  const { changePassword, isUpdating } = useUserSettings()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword])
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isUpdating

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setSuccess(false)

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      const result = await changePassword({
        currentPassword,
        newPassword,
      })

      if (result.success) {
        setSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast.success("Password changed successfully")
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || "Failed to change password")
      }
    },
    [currentPassword, newPassword, confirmPassword, changePassword]
  )

  return (
    <Card className="gap-0">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm">Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
          {/* Current password */}
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  if (error) setError(null)
                }}
                disabled={isUpdating}
                className="pl-7 pr-8"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? (
                  <EyeIcon className="size-3.5" />
                ) : (
                  <EyeSlashIcon className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          <Separator />

          {/* New password */}
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (error) setError(null)
                }}
                disabled={isUpdating}
                className="pl-7 pr-8"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNew ? (
                  <EyeIcon className="size-3.5" />
                ) : (
                  <EyeSlashIcon className="size-3.5" />
                )}
              </button>
            </div>

            {/* Strength indicator */}
            {newPassword.length > 0 && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-300",
                        i < strength.level ? strength.color : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <span
                  className={cn(
                    "text-[0.65rem] font-medium",
                    strength.level <= 1 && "text-red-500",
                    strength.level === 2 && "text-orange-400",
                    strength.level === 3 && "text-green-400",
                    strength.level === 4 && "text-green-500"
                  )}
                >
                  {strength.label}
                </span>
              </div>
            )}

            {/* Requirements */}
            <div className="flex flex-col gap-1 mt-1">
              {requirements.map((req) => {
                const met = req.test(newPassword)
                return (
                  <div
                    key={req.label}
                    className="flex items-center gap-1.5 text-[0.65rem]"
                  >
                    <CheckCircleIcon
                      className={cn(
                        "size-3 shrink-0 transition-colors",
                        met ? "text-green-500" : "text-muted-foreground/40"
                      )}
                    />
                    <span
                      className={cn(
                        "transition-colors",
                        met
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {req.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Confirm password */}
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError(null)
                }}
                disabled={isUpdating}
                className={cn(
                  "pl-7 pr-8",
                  passwordsMismatch &&
                    "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                )}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeIcon className="size-3.5" />
                ) : (
                  <EyeSlashIcon className="size-3.5" />
                )}
              </button>
            </div>
            {passwordsMatch && (
              <p className="text-[0.65rem] text-green-500 flex items-center gap-1 animate-in fade-in">
                <CheckCircleIcon className="size-3" />
                Passwords match
              </p>
            )}
            {passwordsMismatch && (
              <p className="text-[0.65rem] text-destructive flex items-center gap-1 animate-in fade-in">
                <WarningCircleIcon className="size-3" />
                Passwords do not match
              </p>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive animate-in fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircleIcon className="size-3.5" />
              Password updated successfully
            </div>
          )}

          <div>
            <Button type="submit" disabled={!canSubmit}>
              {isUpdating ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
