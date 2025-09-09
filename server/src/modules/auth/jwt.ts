import { SignJWT, jwtVerify } from 'jose'
import { env } from '../../config/env'

export interface JwtUserPayload {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'student'
  schoolId?: string
  studentId?: string
  teacherId?: string
  grade?: string
  department?: string
}

const secret = new TextEncoder().encode(env.jwtSecret)

export async function signToken(payload: JwtUserPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JwtUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JwtUserPayload
  } catch {
    return null
  }
}

