"use client"

import { useState, useCallback } from "react"
import {
  CameraIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  UserIcon,
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"
import { TimeAgo } from "@/components/dashboard/time-ago"

export function ProfileForm() {
  const { user, isUpdating, updateProfile } = useUserSettings()

  const [name, setName] = useState(user?.name ?? "")
  const [imageInput, setImageInput] = useState(user?.image ?? "")
  const [showImageInput, setShowImageInput] = useState(false)

  const hasChanges =
    name.trim() !== (user?.name ?? "") ||
    imageInput.trim() !== (user?.image ?? "")

  const handleSave = useCallback(async () => {
    if (!name.trim()) return

    const ok = await updateProfile({
      name: name.trim(),
      image: imageInput.trim() || undefined,
    })

    if (ok) {
      toast.success("Profile updated")
    } else {
      toast.error("Failed to update profile")
    }
  }, [name, imageInput, updateProfile])

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-7 w-64" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="gap-0">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm">Profile</CardTitle>
        <CardDescription>
          Your personal account information
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-5 max-w-lg">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="group/avatar relative">
              <Avatar size="lg" className="size-16">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name} />
                )}
                <AvatarFallback className="text-lg font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-foreground/60 opacity-0 transition-opacity group-hover/avatar:opacity-100"
              >
                <CameraIcon className="size-4 text-background" />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>

          {/* Image URL input */}
          {showImageInput && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label htmlFor="profile-image">Avatar URL</Label>
              <Input
                id="profile-image"
                placeholder="https://example.com/avatar.jpg"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                disabled={isUpdating}
              />
              <p className="text-[0.65rem] text-muted-foreground">
                Paste a direct URL to an image file
              </p>
            </div>
          )}

          <Separator />

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Name</Label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="profile-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdating}
                className="pl-7"
                maxLength={100}
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <div className="relative">
              <EnvelopeSimpleIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="profile-email"
                value={user.email}
                readOnly
                disabled
                className="pl-7 opacity-70"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {user.emailVerified ? (
                  <Badge variant="secondary" className="gap-0.5 px-1.5">
                    <CheckCircleIcon className="size-2.5 text-green-500" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-1.5">
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Member since */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Member for</span>
            <TimeAgo date={user.createdAt} />
          </div>

          <Separator />

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isUpdating || !name.trim() || !hasChanges}
            >
              {isUpdating ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            {hasChanges && !isUpdating && (
              <span className="text-xs text-muted-foreground animate-in fade-in">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
