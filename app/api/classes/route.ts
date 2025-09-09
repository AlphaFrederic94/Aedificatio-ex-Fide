import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const GET = async (request: NextRequest) => proxy(request, "/classes")
export const POST = requireRole(["admin"])(async (request: NextRequest) => proxy(request, "/classes"))
