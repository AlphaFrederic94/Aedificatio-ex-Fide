import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const GET = requireRole(["admin", "teacher", "student"])(async (request: NextRequest, { params }: { params: { studentId: string } }) => {
  return proxy(request, `/attendance/student/${params.studentId}`)
})

