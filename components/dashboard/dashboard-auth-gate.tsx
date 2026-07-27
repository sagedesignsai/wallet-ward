"use client"

import { useEffect } from "react"
import { useRouter } from "nextjs-toploader/app"

import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardLoadingSkeleton() {
  return (
    <div className="flex h-svh w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-primary/20" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPending } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push("/sign-in")
    }
  }, [isPending, isAuthenticated, router])

  if (isPending) {
    return <DashboardLoadingSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
