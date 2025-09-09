import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"

export async function GET(request: NextRequest) {
  return proxy(request, "/auth/verify")
}
