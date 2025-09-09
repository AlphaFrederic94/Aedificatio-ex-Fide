import { type NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/app/lib/backend"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  const resp = await fetch(`${BACKEND_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const text = await resp.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { error: 'Invalid response' } }

  const res = NextResponse.json(data, { status: resp.status })

  if (resp.ok && data?.token) {
    const secure = request.nextUrl.protocol === 'https:'
    // Set cookie on server response so middleware sees it on the next navigation
    res.cookies.set('auth-token', data.token, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure,
      maxAge: 7 * 24 * 60 * 60,
    })
  }
  return res
}
