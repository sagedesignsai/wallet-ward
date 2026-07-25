import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="w-8 h-8 text-primary" />
        <span className="text-xs text-muted-foreground font-medium animate-pulse">
          Loading Nimbus...
        </span>
      </div>
    </div>
  )
}
