"use client"

import { useState, useCallback } from "react"
import {
  ShieldCheckIcon,
  ShieldWarningIcon,
  LockIcon,
  CopyIcon,
  CheckIcon,
  WarningIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { use2FA } from "@/hooks/use-2fa"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { cn } from "@/lib/utils"

export function TwoFactorSetup({
  initialEnabled,
}: {
  initialEnabled: boolean
}) {
  const { isEnabled, isPending, totpUri, backupCodes, enable2FA, disable2FA } =
    use2FA(initialEnabled)

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "codes">("idle")
  const [codesSaved, setCodesSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedUri, setCopiedUri] = useState(false)

  const handleEnable = useCallback(async () => {
    if (!password) return
    setError(null)

    const result = await enable2FA(password)
    if (result.error) {
      setError(result.error)
      return
    }

    if (result.totpUri) {
      setSetupStep("qr")
    }
    setPassword("")
    toast.success("Two-factor authentication enabled")
  }, [password, enable2FA])

  const handleDisable = useCallback(async () => {
    if (!password) return
    setError(null)

    const result = await disable2FA(password)
    if (result.error) {
      setError(result.error)
      return
    }

    setPassword("")
    toast.success("Two-factor authentication disabled")
  }, [password, disable2FA])

  const handleCopyUri = useCallback(async () => {
    if (!totpUri) return
    try {
      await navigator.clipboard.writeText(totpUri)
      setCopiedUri(true)
      setTimeout(() => setCopiedUri(false), 1500)
    } catch {
      // Fallback
      const textarea = document.createElement("textarea")
      textarea.value = totpUri
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopiedUri(true)
      setTimeout(() => setCopiedUri(false), 1500)
    }
  }, [totpUri])

  const handleCopyCodes = useCallback(async () => {
    const text = backupCodes.join("\n")
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Backup codes copied")
    } catch {
      toast.error("Failed to copy codes")
    }
  }, [backupCodes])

  return (
    <Card className="gap-0">
      <CardHeader className="border-b border-border/40 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </div>
          <Badge
            variant={isEnabled ? "default" : "secondary"}
            className="gap-1 px-2 shrink-0"
          >
            {isEnabled ? (
              <>
                <ShieldCheckIcon className="size-2.5" />
                Enabled
              </>
            ) : (
              <>
                <ShieldWarningIcon className="size-2.5" />
                Disabled
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-4 max-w-lg">
          {!isEnabled && setupStep === "idle" && (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Two-factor authentication adds an additional layer of security
                to your account. Once enabled, you&apos;ll need to enter a
                verification code from your authenticator app when signing in.
              </p>

              {/* Password confirmation */}
              <div className="grid gap-2">
                <Label htmlFor="2fa-password">Enter your password to enable</Label>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="2fa-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Current password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError(null)
                    }}
                    disabled={isPending}
                    className="pl-7 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeIcon className="size-3.5" />
                    ) : (
                      <EyeSlashIcon className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive animate-in fade-in">
                  {error}
                </div>
              )}

              <Button
                onClick={handleEnable}
                disabled={!password || isPending}
              >
                {isPending ? (
                  <>
                    <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Enabling...
                  </>
                ) : (
                  "Enable 2FA"
                )}
              </Button>
            </>
          )}

          {/* QR / TOTP Setup */}
          {!isEnabled && setupStep === "qr" && totpUri && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  Copy this URI into your authenticator app
                </p>
                <div className="flex items-center gap-2 rounded-md bg-background/80 p-3 border border-border/40">
                  <code className="flex-1 truncate text-[0.65rem] font-mono text-foreground break-all">
                    {totpUri}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 h-6 w-6"
                    onClick={handleCopyUri}
                  >
                    {copiedUri ? (
                      <CheckIcon className="size-3.5 text-green-500" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setSetupStep("codes")}
              >
                Continue to Backup Codes
              </Button>
            </div>
          )}

          {/* Backup Codes */}
          {!isEnabled && setupStep === "codes" && backupCodes.length > 0 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-start gap-2">
                  <WarningIcon className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                    Save these backup codes in a safe place. Each code can only
                    be used once. You&apos;ll need these to access your account
                    if you lose your authenticator device.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {backupCodes.map((code, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-muted/50 px-2.5 py-1.5 text-center font-mono text-xs text-foreground border border-border/30"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCodes}
                >
                  <CopyIcon className="size-3" />
                  Copy All Codes
                </Button>
              </div>

              <Separator />

              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={codesSaved}
                  onChange={(e) => setCodesSaved(e.target.checked)}
                  className="mt-0.5 size-3.5 rounded border-input accent-primary"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  I have saved my backup codes in a safe place
                </span>
              </label>

              <Button
                onClick={() => {
                  setSetupStep("idle")
                  setCodesSaved(false)
                }}
                disabled={!codesSaved}
              >
                Done
              </Button>
            </div>
          )}

          {/* Enabled state: Disable */}
          {isEnabled && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Two-factor authentication is currently enabled on your account.
                You&apos;ll be asked for a verification code when signing in.
              </p>

              <div className="grid gap-2">
                <Label htmlFor="disable-2fa-password">
                  Enter your password to disable
                </Label>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="disable-2fa-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Current password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError(null)
                    }}
                    disabled={isPending}
                    className="pl-7 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeIcon className="size-3.5" />
                    ) : (
                      <EyeSlashIcon className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive animate-in fade-in">
                  {error}
                </div>
              )}

              <ConfirmDialog
                trigger={
                  <Button
                    variant="destructive"
                    disabled={!password || isPending}
                  >
                    {isPending ? (
                      <>
                        <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Disabling...
                      </>
                    ) : (
                      "Disable 2FA"
                    )}
                  </Button>
                }
                title="Disable two-factor authentication?"
                description="This will remove the extra security layer from your account. You'll only need your password to sign in."
                confirmLabel="Disable 2FA"
                variant="destructive"
                onConfirm={handleDisable}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
