import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const GET = requireRole(["admin", "teacher"])(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return proxy(request, `/assignments/${params.id}/grades`)
})

export const POST = requireRole(["admin", "teacher"])(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return proxy(request, `/assignments/${params.id}/grades`)
})

