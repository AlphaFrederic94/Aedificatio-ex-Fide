import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"

export async function GET(
  request: NextRequest,
  { params }: { params: { actorId: string } }
) {
  return proxy(request, `/audit/actor/${params.actorId}`)
}

