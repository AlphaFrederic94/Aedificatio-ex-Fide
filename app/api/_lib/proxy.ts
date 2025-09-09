import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/lib/backend'

export async function proxy(request: NextRequest, path: string, init?: RequestInit) {
  const url = `${BACKEND_URL}${path}`
  // Forward Authorization header if present, otherwise fall back to auth-token cookie
  const cookieToken = request.cookies.get('auth-token')?.value
  const authHeader = request.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : undefined)

  const options: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    ...init,
  }

  try {
    const resp = await fetch(url, options)
    const body = await resp.text()
    return new NextResponse(body, {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' }
    })
  } catch (error) {
    console.error(`Proxy error for ${url}:`, error)
    return new NextResponse(JSON.stringify({ error: 'Proxy request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

