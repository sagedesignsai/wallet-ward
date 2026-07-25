"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  UserIcon,
  EnvelopeSimpleIcon,
  LockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react"

import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AuthCardHeader } from "@/components/auth/auth-card-header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SignUpFormProps {
  onSuccess?: () => void
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password strength logic
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    }
  }, [password])

  const strengthScore = useMemo(() => {
    let score = 0
    if (passwordCriteria.minLength) score += 20
    if (passwordCriteria.hasUpper) score += 20
    if (passwordCriteria.hasLower) score += 20
    if (passwordCriteria.hasNumber) score += 20
    if (passwordCriteria.hasSpecial) score += 20
    return score
  }, [passwordCriteria])

  const strengthLabel = useMemo(() => {
    if (strengthScore === 0) return ""
    if (strengthScore <= 40) return "Weak"
    if (strengthScore <= 80) return "Moderate"
    return "Strong"
  }, [strengthScore])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (strengthScore < 60) {
      setError("Please choose a stronger password.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      })

      if (res.error) {
        setError(res.error.message || "Registration failed.")
        setIsLoading(false)
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-border/40 shadow-xl bg-card/80 backdrop-blur-md">
      <CardContent className="pt-6 space-y-6">
        <AuthCardHeader
          title="Create an Account"
          description="Start managing your secrets securely with Wallet Ward"
          badgeText="Encrypted Storage"
          icon="shield"
        />

        {error && (
          <Alert variant="destructive" className="py-2.5 px-3 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <div className="relative flex items-center">
                <EnvelopeSimpleIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative flex items-center">
                <LockIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
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
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strength:</span>
                    <span
                      className={`font-semibold ${
                        strengthScore <= 40
                          ? "text-destructive"
                          : strengthScore <= 80
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {strengthLabel}
                    </span>
                  </div>
                  <Progress value={strengthScore} className="h-1.5" />
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-1">
                      {passwordCriteria.minLength ? (
                        <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-3 h-3 text-muted-foreground/60" />
                      )}
                      <span>At least 8 chars</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordCriteria.hasNumber ? (
                        <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-3 h-3 text-muted-foreground/60" />
                      )}
                      <span>Contains number</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordCriteria.hasUpper ? (
                        <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-3 h-3 text-muted-foreground/60" />
                      )}
                      <span>Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordCriteria.hasSpecial ? (
                        <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-3 h-3 text-muted-foreground/60" />
                      )}
                      <span>Special character</span>
                    </div>
                  </div>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <div className="relative flex items-center">
                <LockIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>
            </Field>
          </FieldGroup>

          <Button type="submit" className="w-full gap-2 font-medium" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex items-center justify-center border-t border-border/40 py-4 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
