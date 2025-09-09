import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from './jwt'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const token = authHeader.substring(7)
  const user = await verifyToken(token)
  if (!user) return res.status(401).json({ error: 'Invalid token' })
  ;(req as any).user = user
  next()
}

export function requireRole(roles: Array<'admin' | 'teacher' | 'student'>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })
    ;(req as any).user = user
    next()
  }
}

