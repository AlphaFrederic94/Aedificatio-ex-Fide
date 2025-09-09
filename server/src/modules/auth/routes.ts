import { Router } from 'express'
import { prisma } from '../../infrastructure/prisma/client'
import { verifyPassword } from './password'
import { signToken } from './jwt'

export const authRouter = Router()

authRouter.post('/', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await verifyPassword(user.password, password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const payload: any = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'admin' | 'teacher' | 'student',
    schoolId: user.schoolId,
  }

  // Attach domain extras
  if (user.role === 'student') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } })
    Object.assign(payload, { studentId: s?.id, grade: s?.grade })
  }
  if (user.role === 'teacher') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } })
    Object.assign(payload, { teacherId: t?.id, department: t?.department })
  }

  const token = await signToken(payload)
  res.json({ token, user: payload })
})

authRouter.get('/verify', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
  const token = auth.slice(7)
  const { verifyToken } = await import('./jwt')
  const user = await verifyToken(token)
  if (!user) return res.status(401).json({ error: 'Invalid token' })
  res.json({ user })
})

