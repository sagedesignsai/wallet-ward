"use client"

import React, { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  ShieldCheckIcon,
  CopyIcon,
  CheckIcon,
  DownloadSimpleIcon,
  LockIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { useTwoFactor } from "@/hooks/use-two-factor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AuthCardHeader } from "@/components/auth/auth-card-header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

interface TwoFactorSetupCardProps {
  onCompleted?: () => void
  onCancel?: () => void
}

export function TwoFactorSetupCard({
  onCompleted,
  onCancel,
}: TwoFactorSetupCardProps) {
  const { enableTwoFactor, verifyTotp, isLoading, error, setError } =
    useTwoFactor()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [totpURI, setTotpURI] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState("")
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)
  const [savedBackupCodes, setSavedBackupCodes] = useState(false)

  // Extract secret key from otpauth:// URI for manual entry
  const secretKey = React.useMemo(() => {
    if (!totpURI) return ""
    try {
      const url = new URL(totpURI)
      return url.searchParams.get("secret") || ""
    } catch {
      return ""
    }
  }, [totpURI])

  // Step 1: Password submit
  const handleInitiateSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError("Password is required to setup 2FA.")
      return
    }

    setError(null)
    const res = await enableTwoFactor(password)
    if (res && res.totpURI) {
      setTotpURI(res.totpURI)
      setBackupCodes(res.backupCodes || [])
      setStep(2)
    }
  }

  // Step 3: Verify token
  const handleVerifyTotp = async (code: string) => {
    if (code.length !== 6) return
    setError(null)

    const res = await verifyTotp(code)
    if (res.success) {
      toast.success("Two-Factor Authentication verified & activated!")
      setStep(4)
    }
  }

  // Copy secret key
  const handleCopySecretKey = () => {
    if (!secretKey) return
    navigator.clipboard.writeText(secretKey)
    setCopiedKey(true)
    toast.success("Secret key copied to clipboard")
    setTimeout(() => setCopiedKey(false), 2000)
  }

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopiedBackupCodes(true)
    toast.success("Backup codes copied to clipboard")
    setTimeout(() => setCopiedBackupCodes(false), 2000)
  }

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return
    const text = `Flowspace - 2FA Recovery Backup Codes\nGenerated at: ${new Date().toISOString()}\n\nKeep these codes in a secure, offline location. Each code can only be used once.\n\n${backupCodes.join(
      "\n"
    )}`
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "flowspace-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Backup codes downloaded")
  }

  return (
    <Card className="w-full max-w-lg border-border/40 bg-card/80 shadow-xl backdrop-blur-md">
      <CardContent className="space-y-6 pt-6">
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step === s
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : step > s
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckIcon className="h-3.5 w-3.5" /> : s}
              </div>
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                {s === 1 && "Auth"}
                {s === 2 && "Scan"}
                {s === 3 && "Verify"}
                {s === 4 && "Backup"}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="px-3 py-2.5 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* STEP 1: Re-authenticate with password */}
        {step === 1 && (
          <div className="space-y-4">
            <AuthCardHeader
              title="Enable Two-Factor Auth"
              description="Confirm your account password to generate your 2FA authenticator QR code."
              icon="lock"
            />

            <form onSubmit={handleInitiateSetup} className="space-y-4 pt-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="setup-password">
                    Current Password
                  </FieldLabel>
                  <div className="relative flex items-center">
                    <LockIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="setup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-9 pl-9"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full gap-2 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    <span>Generating key...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Setup</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: Scan QR Code */}
        {step === 2 && totpURI && (
          <div className="space-y-5">
            <AuthCardHeader
              title="Scan Authenticator QR Code"
              description="Scan this QR code with Google Authenticator, Authy, or 1Password."
              icon="shield"
            />

            <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-4 shadow-inner">
              <QRCodeSVG
                value={totpURI}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            {secretKey && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Can&apos;t scan QR code? Enter key manually:
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={secretKey}
                    className="bg-muted/30 font-mono text-xs tracking-widest select-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecretKey}
                    title="Copy Secret Key"
                  >
                    {copiedKey ? (
                      <CheckIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={() => setStep(3)}
              className="w-full gap-2 font-medium"
            >
              <span>Next: Verify Code</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 3: Verify Token */}
        {step === 3 && (
          <div className="space-y-5">
            <AuthCardHeader
              title="Verify 2FA Activation"
              description="Enter the 6-digit code currently generated by your authenticator app."
              icon="shield"
            />

            <div className="flex flex-col items-center space-y-4 pt-2">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={(val) => {
                  setVerificationCode(val)
                  if (val.length === 6) {
                    handleVerifyTotp(val)
                  }
                }}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-10 text-base" />
                  <InputOTPSlot index={1} className="h-12 w-10 text-base" />
                  <InputOTPSlot index={2} className="h-12 w-10 text-base" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="h-12 w-10 text-base" />
                  <InputOTPSlot index={4} className="h-12 w-10 text-base" />
                  <InputOTPSlot index={5} className="h-12 w-10 text-base" />
                </InputOTPGroup>
              </InputOTP>

              <Button
                onClick={() => handleVerifyTotp(verificationCode)}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full gap-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    <span>Activating 2FA...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>Activate Two-Factor Auth</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Backup Codes */}
        {step === 4 && (
          <div className="space-y-5">
            <AuthCardHeader
              title="Save Backup Recovery Codes"
              description="Store these backup codes safely. If you lose your phone, backup codes are the only way to regain access to your Flowspace account."
              badgeText="Crucial Step"
              icon="shield"
            />

            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
              <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                Each recovery code can only be used once. Keep them in a
                password manager or safe place.
              </span>
            </div>

            {backupCodes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 text-center font-mono text-xs tracking-widest">
                {backupCodes.map((c, i) => (
                  <div
                    key={i}
                    className="rounded border bg-background/80 p-1.5 shadow-xs select-all"
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-1.5 text-xs"
                onClick={handleCopyBackupCodes}
              >
                {copiedBackupCodes ? (
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5" />
                )}
                <span>Copy Codes</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-1.5 text-xs"
                onClick={handleDownloadBackupCodes}
              >
                <DownloadSimpleIcon className="h-3.5 w-3.5" />
                <span>Download .txt</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="saved-codes-check"
                checked={savedBackupCodes}
                onCheckedChange={(chk: boolean) => setSavedBackupCodes(!!chk)}
              />
              <label
                htmlFor="saved-codes-check"
                className="cursor-pointer text-xs leading-none font-medium text-muted-foreground"
              >
                I have saved these recovery backup codes in a safe place
              </label>
            </div>

            <Button
              className="w-full gap-2 font-medium"
              disabled={!savedBackupCodes}
              onClick={() => {
                if (onCompleted) {
                  onCompleted()
                }
              }}
            >
              <CheckIcon className="h-4 w-4" />
              <span>Complete Setup</span>
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/40 bg-muted/20 py-4">
        {step > 1 && step < 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Back</span>
          </Button>
        )}
        {onCancel && step !== 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
