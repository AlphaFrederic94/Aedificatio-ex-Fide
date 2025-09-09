import { NextRequest } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Forward the request to the backend server
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000'
  const body = await request.text()

  const response = await fetch(`${backendUrl}/api/assignments/${id}/grade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': request.headers.get('Authorization') || '',
      'Cookie': request.headers.get('Cookie') || ''
    },
    body
  })

  const data = await response.text()

  return new Response(data, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
