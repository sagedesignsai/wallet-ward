"use client"

import React, { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  DeviceMobileIcon,
  KeyIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "@phosphor-icons/react"

import { useTwoFactor } from "@/hooks/use-two-factor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AuthCardHeader } from "@/components/auth/auth-card-header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

interface TwoFactorVerifyCardProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function TwoFactorVerifyCard({
  onSuccess,
  onCancel,
}: TwoFactorVerifyCardProps) {
  const router = useRouter()
  const { verifyTotp, verifyBackupCode, isLoading, error, setError } =
    useTwoFactor()

  const [activeTab, setActiveTab] = useState<"totp" | "backup">("totp")
  const [code, setCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(false)

  const handleVerifyTotp = async (totpCode: string) => {
    if (totpCode.length !== 6) return
    setError(null)

    const result = await verifyTotp(totpCode, trustDevice)
    if (result.success) {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard")
      }
    }
  }

  const handleVerifyBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!backupCode.trim()) {
      setError("Please enter a valid backup code.")
      return
    }

    setError(null)
    const result = await verifyBackupCode(backupCode.trim(), trustDevice)
    if (result.success) {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard")
      }
    }
  }

  return (
    <Card className="w-full border-border/40 bg-card/80 shadow-xl backdrop-blur-md">
      <CardContent className="space-y-6 pt-6">
        <AuthCardHeader
          title="Two-Factor Challenge"
          description="Enter your verification code to complete sign in"
          badgeText="2FA Protected"
          icon="shield"
        />

        {error && (
          <Alert variant="destructive" className="px-3 py-2.5 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(val: string) => {
            setActiveTab(val as "totp" | "backup")
            setError(null)
          }}
          className="w-full"
        >
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="gap-1.5 text-xs">
              <DeviceMobileIcon className="h-3.5 w-3.5" />
              <span>Authenticator</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-1.5 text-xs">
              <KeyIcon className="h-3.5 w-3.5" />
              <span>Backup Code</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-5">
            <div className="flex flex-col items-center space-y-3 py-2">
              <span className="text-center text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app (e.g. Google
                Authenticator, 1Password)
              </span>

              <div className="pt-2">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(val: string) => {
                    setCode(val)
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
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="trust-device-totp"
                checked={trustDevice}
                onCheckedChange={(chk: boolean | "indeterminate") =>
                  setTrustDevice(!!chk)
                }
              />
              <label
                htmlFor="trust-device-totp"
                className="cursor-pointer text-xs leading-none font-medium text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Trust this device for 30 days
              </label>
            </div>

            <Button
              className="w-full gap-2 font-medium"
              onClick={() => handleVerifyTotp(code)}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Verify Code</span>
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <form onSubmit={handleVerifyBackup} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="backup-code">
                    Backup Recovery Code
                  </FieldLabel>
                  <Input
                    id="backup-code"
                    type="text"
                    placeholder="xxxx-xxxx-xxxx"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    className="text-center font-mono tracking-wider"
                    disabled={isLoading}
                  />
                </Field>
              </FieldGroup>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trust-device-backup"
                  checked={trustDevice}
                  onCheckedChange={(chk: boolean | "indeterminate") =>
                    setTrustDevice(!!chk)
                  }
                />
                <label
                  htmlFor="trust-device-backup"
                  className="cursor-pointer text-xs leading-none font-medium text-muted-foreground"
                >
                  Trust this device for 30 days
                </label>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-medium"
                disabled={isLoading || !backupCode.trim()}
              >
                {isLoading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Use Recovery Code</span>
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/40 bg-muted/20 py-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (onCancel) {
              onCancel()
            } else {
              router.push("/sign-in")
            }
          }}
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
