import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { attendanceRepo, classRepo, studentRepo } from '../../infrastructure/prisma/repositories'
import { appendBlock } from '../audit/blockchain'

export const attendanceRouter = Router()

// List attendance for a class (optional date)
attendanceRouter.get('/class/:classId', requireRole(['admin', 'teacher']), async (req, res) => {
  const { classId } = req.params
  const { date } = req.query
  const rows = await attendanceRepo.listForClass(classId, date ? new Date(String(date)) : undefined)
  res.json(rows)
})

// List attendance for a student
attendanceRouter.get('/student/:studentId', requireRole(['admin', 'teacher']), async (req, res) => {
  const { studentId } = req.params
  const rows = await attendanceRepo.listForStudent(studentId)
  res.json(rows)
})

// Record or update attendance
attendanceRouter.post('/', requireRole(['admin', 'teacher']), async (req, res) => {
  const { classId, studentId, date, status, note } = req.body || {}
  const user = (req as any).user
  if (!classId || !studentId || !date || !status) return res.status(400).json({ error: 'classId, studentId, date, status required' })

  const allowed: Array<'present' | 'absent' | 'late' | 'excused'> = ['present', 'absent', 'late', 'excused']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  // simple school scope check
  const c = await classRepo.getById(classId)
  const s = await studentRepo.getById(studentId)
  if (!c || !s || c.schoolId !== user.schoolId || s.schoolId !== user.schoolId) {
    return res.status(400).json({ error: 'Class and Student must belong to your school' })
  }

  // Only a teacher has a valid recordedById (FK to Teacher)
  const recordedById = user.role === 'teacher' ? user.teacherId : null

  const saved = await attendanceRepo.upsert({ classId, studentId, date: new Date(date), status, note: note ?? null, recordedById })
  await appendBlock({ action: 'attendance.upsert', actorId: user.id, entity: 'attendance', entityId: saved.id, payload: { classId, studentId, date, status } })
  res.status(201).json(saved)
})

