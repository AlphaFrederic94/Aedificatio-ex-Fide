import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"
import { BACKEND_URL } from "@/app/lib/backend"

// Define protected routes and their required roles
const protectedRoutes = {
  "/admin": ["admin"],
  "/teacher": ["teacher"],
  "/student": ["student"],
  "/api/students": ["admin", "teacher", "student"],
  "/api/students/": ["admin", "teacher", "student"],
  "/api/teachers": ["admin", "teacher", "student"],
  "/api/teachers/": ["admin", "teacher", "student"],
  "/api/classes": ["admin", "teacher", "student"],
  "/api/classes/": ["admin", "teacher", "student"],
  "/api/attendance": ["admin", "teacher", "student"],
  "/api/attendance/": ["admin", "teacher", "student"],
  "/api/enrollments": ["admin", "teacher", "student"],
  "/api/enrollments/": ["admin", "teacher", "student"],
  "/api/assignments": ["admin", "teacher", "student"],
  "/api/assignments/": ["admin", "teacher", "student"],
  "/api/messages": ["admin", "teacher", "student"],
  "/api/messages/": ["admin", "teacher", "student"],
  "/api/submissions": ["admin", "teacher", "student"],
  "/api/submissions/": ["admin", "teacher", "student"],
  "/api/reports": ["admin"],
  "/api/reports/": ["admin"],
  "/api/audit": ["admin"],
  "/api/audit/": ["admin"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route needs protection
  const routePattern = Object.keys(protectedRoutes).find((pattern) => pathname.startsWith(pattern))

  if (!routePattern) {
    return NextResponse.next()
  }
  // Debug in dev: see token presence when navigating to protected paths
  if (process.env.NODE_ENV !== 'production') {
    const hasCookie = !!request.cookies.get('auth-token')?.value
    const hasAuth = !!request.headers.get('authorization')
    console.log(`[middleware] path=${pathname} protected=${routePattern} hasCookie=${hasCookie} hasAuth=${hasAuth}`)
  }

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get("authorization")
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
  const token = tokenFromHeader || request.cookies.get("auth-token")?.value

  if (!token) {
    // Redirect to login for protected routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Try local verify first
  let user = await verifyToken(token)

  // If local verify failed, fall back to backend verification to avoid secret mismatch issues
  if (!user) {
    try {
      const resp = await fetch(`${BACKEND_URL}/auth/verify`, { headers: { Authorization: `Bearer ${token}` } })
      if (resp.ok) {
        const data = await resp.json()
        user = data.user
      }
    } catch {}
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Check if user has required role for this route
  const requiredRoles = protectedRoutes[routePattern as keyof typeof protectedRoutes]
  if (!requiredRoles.includes(user.role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Redirect to appropriate portal based on user role
    const redirectMap = {
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
    }
    return NextResponse.redirect(new URL(redirectMap[user.role], request.url))
  }

  // Add user info to request headers for API routes
  if (pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", user.id)
    requestHeaders.set("x-user-role", user.role)
    requestHeaders.set("x-user-email", user.email)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
