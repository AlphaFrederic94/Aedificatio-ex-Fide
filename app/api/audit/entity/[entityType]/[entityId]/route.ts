import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  return proxy(request, `/audit/entity/${params.entityType}/${params.entityId}`)
}

