import { type NextRequest } from "next/server"
import { proxy } from "@/app/api/_lib/proxy"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return proxy(request, `/teachers/${params.id}`)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return proxy(request, `/teachers/${params.id}`)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return proxy(request, `/teachers/${params.id}`)
}
