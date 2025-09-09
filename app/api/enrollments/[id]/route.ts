import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const DELETE = requireRole(["admin", "teacher"])(async (request: NextRequest, { params }: { params: { id: string } }) => {
  return proxy(request, `/enrollments/${params.id}`)
})

