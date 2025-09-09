import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const POST = requireRole(["admin", "teacher"])(async (request: NextRequest) => {
  return proxy(request, "/attendance")
})

