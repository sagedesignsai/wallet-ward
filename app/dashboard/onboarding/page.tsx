"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  SparkleIcon,
  LockSimpleIcon,
  FolderIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useOrganization } from "@/hooks/use-organization"
import { useProjects } from "@/hooks/use-projects"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function OnboardingPage() {
  const { setConfig } = useDashboardConfig()
  const router = useRouter()
  const { organizations, isLoading: orgsLoading } = useOrganization()
  const { projects, isLoading: projectsLoading } = useProjects()

  useEffect(() => {
    setConfig({
      title: "",
      description: "",
      breadcrumbs: [],
    })
  }, [setConfig])

  // If user already has org and project, skip onboarding
  useEffect(() => {
    if (!orgsLoading && !projectsLoading) {
      if (organizations.length > 0 && projects.length > 0) {
        router.push("/dashboard")
      }
    }
  }, [organizations, projects, orgsLoading, projectsLoading, router])

  const handleStart = () => {
    router.push("/dashboard/onboarding/organization")
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      {/* Background visual elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 animate-[pulse_10s_ease-in-out_2s_infinite] rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Welcome Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <SparkleIcon className="size-6 text-primary" weight="duotone" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to Flowspace
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Let's set up your workspace in 2 quick steps
            </p>
          </div>
        </div>

        {/* Steps Overview */}
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {[
            {
              icon: LockSimpleIcon,
              step: "Step 1",
              title: "Create Organization",
              description:
                "Set up your organization as a security boundary for your team",
              color: "from-blue-500/20 to-blue-500/5",
            },
            {
              icon: FolderIcon,
              step: "Step 2",
              title: "Create Project",
              description:
                "Projects organize your secrets and environments",
              color: "from-violet-500/20 to-violet-500/5",
            },
          ].map((item, i) => (
            <Card
              key={i}
              className="border border-border/40 bg-gradient-to-br"
              style={{ backgroundImage: `linear-gradient(to bottom right, var(--color-1), var(--color-2))` } as any}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="size-5" weight="duotone" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-primary">
                      {item.step}
                    </p>
                    <h3 className="mt-1 font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Benefits */}
        <div className="w-full">
          <div className="rounded-xl border border-border/40 bg-muted/20 p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              What you'll get:
            </h2>
            <div className="space-y-3">
              {[
                "Encrypted secret vault for all your credentials",
                "Organization-wide access control and permissions",
                "Project-based organization of environments",
                "AI-powered agent capabilities",
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleStart}
          size="lg"
          className="w-full gap-2 font-semibold shadow-lg shadow-primary/20 sm:w-auto"
        >
          <span>Let's Get Started</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="M4 10h12M10 4l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You can always skip and set these up later from your dashboard
        </p>
      </div>
    </div>
  )
}
