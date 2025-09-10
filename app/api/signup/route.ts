import { type NextRequest, NextResponse } from "next/server"
import { BACKEND_URL } from "@/app/lib/backend"

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  try {
    const resp = await fetch(`${BACKEND_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    const text = await resp.text()
    let data: any
    try { 
      data = JSON.parse(text) 
    } catch { 
      data = { error: 'Invalid response from server' } 
    }

    const res = NextResponse.json(data, { status: resp.status })

    // If signup successful and token returned, set auth cookie
    if (resp.ok && data?.token) {
      const secure = request.nextUrl.protocol === 'https:'
      res.cookies.set('auth-token', data.token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure,
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }
    
    return res
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to server' }, 
      { status: 500 }
    )
  }
}
