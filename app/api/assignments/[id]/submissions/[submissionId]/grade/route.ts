import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const PUT = requireRole(["teacher"])(async (request: NextRequest, { params }: { params: Promise<{ id: string, submissionId: string }> }) => {
  const { id, submissionId } = await params
  return proxy(request, `/assignments/${id}/submissions/${submissionId}/grade`)
})
