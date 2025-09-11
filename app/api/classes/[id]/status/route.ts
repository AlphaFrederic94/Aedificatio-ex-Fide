import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const PATCH = requireRole(["admin"])(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return proxy(request, `/classes/${id}/status`)
})
