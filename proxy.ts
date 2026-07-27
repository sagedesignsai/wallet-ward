import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const DASHBOARD_RE = /^\/dashboard(?:\/|$)/

// Paths that are exempt from org + project checks (onboarding flow, org management)
const EXEMPT_PATHS = [
  "/dashboard/onboarding",         // onboarding wizard pages
  "/dashboard/organizations/new", // org creation
  "/dashboard/organizations",     // org list / management
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only intercept dashboard routes
  if (!DASHBOARD_RE.test(pathname)) {
    return NextResponse.next()
  }

  // Skip exempt paths (onboarding, org creation, org management)
  if (EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }

  // Get session from request cookies
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    // Let the client-side auth gate handle sign-in redirect
    return NextResponse.next()
  }

  // ── Step 1: Check if user belongs to any organizations ────────────
  const memberCount = await prisma.member.count({
    where: { userId: session.user.id },
  })

  if (memberCount === 0) {
    return NextResponse.redirect(
      new URL("/dashboard/onboarding", request.url)
    )
  }

  // ── Step 2: Resolve the active org and check for projects ─────────
  // Use the active org from the session, or fall back to the first membership
  const members = await prisma.member.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    take: 1,
  })

  const targetOrgId =
    (session as { activeOrganizationId?: string | null }).activeOrganizationId ?? members[0]?.organizationId

  if (!targetOrgId) {
    return NextResponse.next()
  }

  const projectCount = await prisma.project.count({
    where: { organizationId: targetOrgId },
  })

  if (projectCount === 0) {
    return NextResponse.redirect(
      new URL("/dashboard/onboarding/project", request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
