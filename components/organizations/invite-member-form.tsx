"use client"

import { useState, useCallback } from "react"
import {
  PaperPlaneRightIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type InviteMemberFormProps = {
  onInvite: (input: { email: string; role: string }) => Promise<{
    id: string
    email: string
    role: string
  } | null>
}

export function InviteMemberForm({ onInvite }: InviteMemberFormProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const reset = useCallback(() => {
    setEmail("")
    setRole("member")
    setError(null)
    setSuccess(false)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmed = email.trim()
      if (!trimmed) {
        setError("Email is required.")
        return
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError("Please enter a valid email address.")
        return
      }

      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      const result = await onInvite({ email: trimmed, role })

      if (result) {
        setSuccess(true)
        setEmail("")
        setRole("member")
        // Clear success message after a few seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError("Failed to send invitation. Please try again.")
      }

      setIsSubmitting(false)
    },
    [email, role, onInvite]
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-2">
        <Label htmlFor="invite-email" className="text-muted-foreground">
          Invite by email
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <EnvelopeSimpleIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
                if (success) setSuccess(false)
              }}
              className="pl-7"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <Select value={role} onValueChange={setRole} disabled={isSubmitting}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            disabled={!email.trim() || isSubmitting}
            className="shrink-0 shadow-sm shadow-primary/10 transition-shadow hover:shadow-md hover:shadow-primary/20"
          >
            {isSubmitting ? (
              <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <PaperPlaneRightIcon />
            )}
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {success && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Invitation sent successfully.
        </p>
      )}
    </form>
  )
}
