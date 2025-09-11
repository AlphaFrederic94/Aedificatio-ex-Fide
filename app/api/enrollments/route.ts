import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const GET = requireRole(["admin", "teacher", "student"])(async (request: NextRequest) => {
  return proxy(request, "/enrollments")
})

export const POST = requireRole(["admin", "teacher", "student"])(async (request: NextRequest) => {
  return proxy(request, "/enrollments")
})

