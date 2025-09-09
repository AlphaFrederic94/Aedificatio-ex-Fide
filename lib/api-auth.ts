import type { NextRequest } from "next/server"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: "admin" | "teacher" | "student"
    studentId?: string
    teacherId?: string
    grade?: string
    department?: string
  }
}

export async function getAuthenticatedUser(request: NextRequest) {
  // Get user info from middleware-set headers
  const userId = request.headers.get("x-user-id")
  const userRole = request.headers.get("x-user-role")
  const userEmail = request.headers.get("x-user-email")

  if (!userId || !userRole || !userEmail) {
    return null
  }

  return {
    id: userId,
    role: userRole as "admin" | "teacher" | "student",
    email: userEmail,
    name: "", // Would be fetched from database in real app
    studentId: userRole === "student" ? userId : undefined,
    teacherId: userRole === "teacher" ? userId : undefined,
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
    // Add user to request object
    ;(request as AuthenticatedRequest).user = user

    return handler(request as AuthenticatedRequest)
  }
}

export function requireRole(roles: string[]) {
  return (handler: (req: AuthenticatedRequest, context?: any) => Promise<Response>) => async (request: NextRequest, context?: any) => {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!roles.includes(user.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }
    ;(request as AuthenticatedRequest).user = user
    return handler(request as AuthenticatedRequest, context)
  }
}
