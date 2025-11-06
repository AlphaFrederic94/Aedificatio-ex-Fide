import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const GET = requireRole(["admin"])(async (request: NextRequest, { params }: { params: { index: string } }) => {
  return proxy(request, `/audit/blocks/${params.index}`)
})

