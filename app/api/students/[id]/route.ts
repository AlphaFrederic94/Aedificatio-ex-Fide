import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"
import { requireRole } from "@/lib/api-auth"

export const GET = requireRole(["admin", "teacher", "student"])(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return proxy(request, `/students/${id}`)
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxy(request, `/students/${id}`)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxy(request, `/students/${id}`)
}
