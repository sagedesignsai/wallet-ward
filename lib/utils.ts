import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract a user-facing error message from an API error response body.
 * Handles both the legacy flat shape (`{ error: "..." }`) and the structured
 * shape (`{ error: { code, message, details } }`) produced by handleRouteError.
 */
export function apiErrorMessage(body: unknown, fallback: string): string {
  const err = (body as { error?: unknown } | null)?.error
  if (typeof err === "string") return err
  if (
    err &&
    typeof err === "object" &&
    typeof (err as { message?: unknown }).message === "string"
  ) {
    return (err as { message: string }).message
  }
  return fallback
}
