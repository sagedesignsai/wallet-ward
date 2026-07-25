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

export function TwoFactorSetupCard({ onCompleted, onCancel }: TwoFactorSetupCardProps) {
  const { enableTwoFactor, verifyTotp, isLoading, error, setError } = useTwoFactor()

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
    const text = `Wallet Ward - 2FA Recovery Backup Codes\nGenerated at: ${new Date().toISOString()}\n\nKeep these codes in a secure, offline location. Each code can only be used once.\n\n${backupCodes.join(
      "\n"
    )}`
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "wallet-ward-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Backup codes downloaded")
  }

  return (
    <Card className="w-full max-w-lg border-border/40 shadow-xl bg-card/80 backdrop-blur-md">
      <CardContent className="pt-6 space-y-6">
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${step === s
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                    : step > s
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {step > s ? <CheckIcon className="w-3.5 h-3.5" /> : s}
              </div>
              <span className="text-[11px] font-medium hidden sm:inline text-muted-foreground">
                {s === 1 && "Auth"}
                {s === 2 && "Scan"}
                {s === 3 && "Verify"}
                {s === 4 && "Backup"}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="py-2.5 px-3 text-xs">
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
                  <FieldLabel htmlFor="setup-password">Current Password</FieldLabel>
                  <div className="relative flex items-center">
                    <LockIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="setup-password"
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

              <Button type="submit" className="w-full gap-2 font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    <span>Generating key...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Setup</span>
                    <ArrowRightIcon className="w-4 h-4" />
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

            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border shadow-inner">
              <QRCodeSVG value={totpURI} size={180} level="H" includeMargin={true} />
            </div>

            {secretKey && (
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Can&apos;t scan QR code? Enter key manually:
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={secretKey}
                    className="font-mono text-xs tracking-widest bg-muted/30 select-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecretKey}
                    title="Copy Secret Key"
                  >
                    {copiedKey ? (
                      <CheckIcon className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <CopyIcon className="w-4 h-4" />
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
              <ArrowRightIcon className="w-4 h-4" />
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
                  <InputOTPSlot index={0} className="w-10 h-12 text-base" />
                  <InputOTPSlot index={1} className="w-10 h-12 text-base" />
                  <InputOTPSlot index={2} className="w-10 h-12 text-base" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="w-10 h-12 text-base" />
                  <InputOTPSlot index={4} className="w-10 h-12 text-base" />
                  <InputOTPSlot index={5} className="w-10 h-12 text-base" />
                </InputOTPGroup>
              </InputOTP>

              <Button
                onClick={() => handleVerifyTotp(verificationCode)}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full gap-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    <span>Activating 2FA...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="w-4 h-4" />
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
              description="Store these backup codes safely. If you lose your phone, backup codes are the only way to regain access to your Wallet Ward account."
              badgeText="Crucial Step"
              icon="shield"
            />

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <WarningIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Each recovery code can only be used once. Keep them in a password manager or safe place.
              </span>
            </div>

            {backupCodes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg border font-mono text-xs text-center tracking-widest">
                {backupCodes.map((c, i) => (
                  <div key={i} className="p-1.5 bg-background/80 rounded border shadow-xs select-all">
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
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
                <span>Copy Codes</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-1.5 text-xs"
                onClick={handleDownloadBackupCodes}
              >
                <DownloadSimpleIcon className="w-3.5 h-3.5" />
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
                className="text-xs font-medium text-muted-foreground leading-none cursor-pointer"
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
              <CheckIcon className="w-4 h-4" />
              <span>Complete Setup</span>
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/40 py-4 bg-muted/20">
        {step > 1 && step < 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back</span>
          </Button>
        )}
        {onCancel && step !== 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
