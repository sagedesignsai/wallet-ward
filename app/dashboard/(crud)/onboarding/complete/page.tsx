"use client"

import { useEffect } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import {
  CheckCircleIcon,
  RocketIcon,
  SparkleIcon,
  FolderIcon,
  KeyIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function OnboardingCompletePage() {
  const { setConfig } = useDashboardConfig()
  const router = useRouter()

  useEffect(() => {
    setConfig({
      title: "",
      description: "",
      breadcrumbs: [],
    })
  }, [setConfig])

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Success Icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-emerald-500/20 blur-xl" />
            <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircleIcon className="size-8 text-emerald-500" weight="fill" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              You're All Set!
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Your workspace is ready. Let's start building.
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="w-full space-y-3">
          <h2 className="text-sm font-semibold text-foreground">What's next:</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: KeyIcon,
                title: "Create Your First Secret",
                description: "Add credentials, API keys, or passwords",
                href: "/dashboard/secrets",
                color: "from-cyan-500/20 to-cyan-500/5",
              },
              {
                icon: SparkleIcon,
                title: "Launch an Agent",
                description: "Let AI handle repetitive tasks",
                href: "/dashboard/agents",
                color: "from-primary/20 to-primary/5",
              },
              {
                icon: FolderIcon,
                title: "Explore Your Project",
                description: "Set up environments and integrations",
                href: "/dashboard/projects",
                color: "from-violet-500/20 to-violet-500/5",
              },
              {
                icon: RocketIcon,
                title: "Connect Tools",
                description: "GitHub, Slack, Vercel, and more",
                href: "/dashboard/integrations",
                color: "from-amber-500/20 to-amber-500/5",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="group border border-border/40 transition-all hover:border-border/60 hover:bg-muted/40"

              >
                <Link href={item.href}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <item.icon className="size-4" weight="duotone" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Highlight */}
        <div className="w-full rounded-xl border border-border/40 bg-muted/20 p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            🎉 You now have access to:
          </h2>
          <div className="space-y-2">
            {[
              "Enterprise-grade encryption for all secrets",
              "Role-based access control (RBAC)",
              "Audit logs for compliance",
              "Autonomous AI agents",
              "Integration ecosystem",
              "Audit trails & activity logs",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" weight="fill" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleGoToDashboard}
          size="lg"
          className="w-full gap-2 font-semibold shadow-lg shadow-primary/20 sm:w-auto"
        >
          <RocketIcon className="size-4" />
          Go to Dashboard
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Need help?{" "}
          <Link href="#" className="font-medium text-primary hover:underline">
            Check our documentation
          </Link>
        </p>
      </div>
    </div>
  )
}
