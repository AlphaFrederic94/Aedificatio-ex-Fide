import { type NextRequest } from "next/server"
import { requireRole } from "@/lib/api-auth"
import { proxy } from "@/app/api/_lib/proxy"

export const GET = requireRole(["admin", "teacher", "student"])(async (request: NextRequest) => {
  return proxy(request, "/teachers")
})

export const POST = requireRole(["admin"])(async (request: NextRequest) => {
  return proxy(request, "/teachers")
})
