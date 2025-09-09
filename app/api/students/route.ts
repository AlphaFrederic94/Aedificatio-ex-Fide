import { type NextRequest } from "next/server"
import { requireRole } from "@/lib/api-auth"
import { proxy } from "@/app/api/_lib/proxy"

export const GET = requireRole(["admin", "teacher"])(async (request: NextRequest) => {
  return proxy(request, "/students")
})

export const POST = requireRole(["admin"])(async (request: NextRequest) => {
  return proxy(request, "/students")
})
