import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="animate-pulse text-xs font-medium text-muted-foreground">
          Loading Flowspace...
        </span>
      </div>
    </div>
  )
}
