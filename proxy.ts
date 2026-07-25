import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const DASHBOARD_RE = /^\/dashboard(?:\/|$)/
const EXEMPT_PATHS = [
  "/dashboard/organizations/new",
  "/dashboard/organizations", // org list / management pages
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only intercept dashboard routes
  if (!DASHBOARD_RE.test(pathname)) {
    return NextResponse.next()
  }

  // Skip org creation & org management pages
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

  // Check if user belongs to any organizations
  const memberCount = await prisma.member.count({
    where: { userId: session.user.id },
  })

  if (memberCount === 0) {
    return NextResponse.redirect(
      new URL("/dashboard/organizations/new", request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
