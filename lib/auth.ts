import { jwtVerify, SignJWT } from "jose"

// Strong JWT secret default; override in env for production
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "x0K3b!2r7Qp9@F1sZ4h8^W6mT3y#N9cG5jR2vL8kP0dS7qH4tU1bM6nY3pE9aC")

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "student"
  studentId?: string // For students
  teacherId?: string // For teachers
  grade?: string // For students
  department?: string // For teachers
}

export async function signToken(payload: User): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as User
  } catch {
    return null
  }
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

export function canAccessResource(userRole: string, resourceType: string): boolean {
  const permissions = {
    admin: ["students", "teachers", "classes", "reports", "settings"],
    teacher: ["classes", "students", "grades", "attendance"],
    student: ["classes", "grades", "assignments", "schedule"],
  }

  return permissions[userRole as keyof typeof permissions]?.includes(resourceType) || false
}

export function getUserPermissions(role: string): string[] {
  const permissions = {
    admin: ["read:all", "write:all", "delete:all"],
    teacher: ["read:own_classes", "write:grades", "write:attendance"],
    student: ["read:own_data", "submit:assignments"],
  }

  return permissions[role as keyof typeof permissions] || []
}
