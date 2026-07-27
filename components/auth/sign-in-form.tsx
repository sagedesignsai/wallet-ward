"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeSimpleIcon,
  LockIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react"

import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AuthCardHeader } from "@/components/auth/auth-card-header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface SignInFormProps {
  onSuccess?: () => void
  onTwoFactorRequired?: () => void
}

export function SignInForm({
  onSuccess,
  onTwoFactorRequired,
}: SignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await signIn.email(
        {
          email,
          password,
          callbackURL: "/dashboard",
        },
        {
          onSuccess: (ctx) => {
            setIsLoading(false)
            if (onSuccess) {
              onSuccess()
            } else {
              router.push("/dashboard")
            }
          },
          onError: (ctx) => {
            setIsLoading(false)
            setError(
              ctx.error.message ||
                "Failed to sign in. Please check your credentials."
            )
          },
          onTwoFactorRedirect: () => {
            setIsLoading(false)
            if (onTwoFactorRequired) {
              onTwoFactorRequired()
            } else {
              router.push("/two-factor")
            }
          },
        }
      )

      // Handle direct response if callbacks aren't synchronously triggered
      if (res && res.error) {
        setError(res.error.message || "Sign in failed")
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during sign in."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-border/40 bg-card/80 shadow-xl backdrop-blur-md">
      <CardContent className="space-y-6 pt-6">
        <AuthCardHeader
          title="Welcome Back"
          description="Sign in to access your secure encrypted vault"
          icon="lock"
        />

        {error && (
          <Alert variant="destructive" className="px-3 py-2.5 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <div className="relative flex items-center">
                <EnvelopeSimpleIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary transition-colors hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <LockIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 pl-9"
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex items-center justify-center border-t border-border/40 bg-muted/20 py-4">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-primary hover:underline"
          >
            Create account
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
