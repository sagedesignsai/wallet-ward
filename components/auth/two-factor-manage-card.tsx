"use client"

import React, { useState } from "react"
import {
  ShieldCheckIcon,
  ShieldWarningIcon,
  KeyIcon,
  LockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  CopyIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { useTwoFactor } from "@/hooks/use-two-factor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { TwoFactorSetupCard } from "./two-factor-setup-card"

interface TwoFactorManageCardProps {
  isTwoFactorEnabled?: boolean
  onStatusChanged?: () => void
}

export function TwoFactorManageCard({
  isTwoFactorEnabled = false,
  onStatusChanged,
}: TwoFactorManageCardProps) {
  const { disableTwoFactor, generateBackupCodes, isLoading, error, setError } = useTwoFactor()

  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isDisableOpen, setIsDisableOpen] = useState(false)
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])
  const [showBackupModal, setShowBackupModal] = useState(false)

  // Handle Disable 2FA
  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError("Password is required to disable 2FA.")
      return
    }

    setError(null)
    const res = await disableTwoFactor(password)
    if (res.success) {
      toast.success("Two-Factor Authentication disabled")
      setIsDisableOpen(false)
      setPassword("")
      if (onStatusChanged) onStatusChanged()
    }
  }

  // Handle Regenerate Backup Codes
  const handleRegenerateBackupCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError("Password is required.")
      return
    }

    setError(null)
    const res = await generateBackupCodes(password)
    if (res.success && res.backupCodes) {
      setNewBackupCodes(res.backupCodes)
      setIsRegenerateOpen(false)
      setShowBackupModal(true)
      setPassword("")
      toast.success("Generated new backup codes!")
    }
  }

  if (isSettingUp) {
    return (
      <TwoFactorSetupCard
        onCompleted={() => {
          setIsSettingUp(false)
          if (onStatusChanged) onStatusChanged()
        }}
        onCancel={() => setIsSettingUp(false)}
      />
    )
  }

  return (
    <>
      <Card className="w-full border-border/40 shadow-sm bg-card">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Two-Factor Authentication (2FA)
              </CardTitle>
              {isTwoFactorEnabled ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  <span>Enabled</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <ShieldWarningIcon className="w-3.5 h-3.5" />
                  <span>Disabled</span>
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Add an extra layer of security to your Wallet Ward account using TOTP authenticator apps.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {isTwoFactorEnabled ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setIsRegenerateOpen(true)}
              >
                <KeyIcon className="w-3.5 h-3.5" />
                <span>Regenerate Backup Codes</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setIsDisableOpen(true)}
              >
                <span>Disable 2FA</span>
              </Button>
            </div>
          ) : (
            <div className="pt-2">
              <Button
                size="sm"
                className="gap-2 text-xs font-medium"
                onClick={() => setIsSettingUp(true)}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Enable Two-Factor Auth</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Modal */}
      <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to disable 2FA? This will make your account significantly less secure.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="py-2 px-3 text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleDisable} className="space-y-4 py-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="disable-password">Confirm Password</FieldLabel>
                <div className="relative flex items-center">
                  <LockIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="disable-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDisableOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="w-4 h-4" /> : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Modal */}
      <Dialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription className="text-xs">
              Regenerating backup codes will invalidate all your previous backup codes immediately.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="py-2 px-3 text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegenerateBackupCodes} className="space-y-4 py-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="regen-password">Confirm Password</FieldLabel>
                <div className="relative flex items-center">
                  <LockIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="regen-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    disabled={isLoading}
                    required
                  />
                </div>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRegenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? <Spinner className="w-4 h-4" /> : "Regenerate Codes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Backup Codes Display Modal */}
      <Dialog open={showBackupModal} onOpenChange={setShowBackupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your New Backup Codes</DialogTitle>
            <DialogDescription className="text-xs">
              Store these new backup codes safely. Old codes will no longer work.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg border font-mono text-xs text-center tracking-widest my-2">
            {newBackupCodes.map((c, i) => (
              <div key={i} className="p-1.5 bg-background/80 rounded border shadow-xs select-all">
                {c}
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(newBackupCodes.join("\n"))
                toast.success("Copied new codes to clipboard")
              }}
            >
              <CopyIcon className="w-3.5 h-3.5" />
              <span>Copy</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowBackupModal(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
