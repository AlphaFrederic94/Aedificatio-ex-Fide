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

// Get attendance for a specific student (students can access their own data)
attendanceRouter.get('/student/:studentId', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const { studentId } = req.params
  const user = (req as any).user

  // Students can only access their own attendance
  if (user.role === 'student' && user.studentId !== studentId) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  try {
    const attendance = await attendanceRepo.listForStudent(studentId)
    res.json(attendance)
  } catch (error) {
    console.error('Get student attendance error:', error)
    res.status(500).json({ error: 'Failed to get attendance' })
  }
})

// Record or update attendance (single or batch)
attendanceRouter.post('/', requireRole(['admin', 'teacher']), async (req, res) => {
  const user = (req as any).user
  const body = req.body || {}

  // Handle batch attendance (array of attendance records)
  if (body.attendance && Array.isArray(body.attendance)) {
    try {
      const results = []
      for (const record of body.attendance) {
        const { classId, studentId, date, present } = record
        const status = present ? 'present' : 'absent'

        if (!classId || !studentId || !date) {
          return res.status(400).json({ error: 'Each attendance record must have classId, studentId, and date' })
        }

        // School scope check
        const c = await classRepo.getById(classId)
        const s = await studentRepo.getById(studentId)
        if (!c || !s || c.schoolId !== user.schoolId || s.schoolId !== user.schoolId) {
          return res.status(400).json({ error: 'Class and Student must belong to your school' })
        }

        const recordedById = user.role === 'teacher' ? user.teacherId : null
        const saved = await attendanceRepo.upsert({
          classId,
          studentId,
          date: new Date(date),
          status,
          note: null,
          recordedById
        })
        results.push(saved)
      }

      await appendBlock({
        action: 'attendance.batch_upsert',
        actorId: user.id,
        entity: 'attendance',
        entityId: 'batch',
        payload: { count: results.length }
      })

      return res.status(201).json({ message: 'Batch attendance saved', count: results.length })
    } catch (error) {
      console.error('Batch attendance error:', error)
      return res.status(500).json({ error: 'Failed to save batch attendance' })
    }
  }

  // Handle single attendance record
  const { classId, studentId, date, status, note } = body
  if (!classId || !studentId || !date || !status) {
    return res.status(400).json({ error: 'classId, studentId, date, status required' })
  }

  const allowed: Array<'present' | 'absent' | 'late' | 'excused'> = ['present', 'absent', 'late', 'excused']
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  // School scope check
  const c = await classRepo.getById(classId)
  const s = await studentRepo.getById(studentId)
  if (!c || !s || c.schoolId !== user.schoolId || s.schoolId !== user.schoolId) {
    return res.status(400).json({ error: 'Class and Student must belong to your school' })
  }

  // Only a teacher has a valid recordedById (FK to Teacher)
  const recordedById = user.role === 'teacher' ? user.teacherId : null

  const saved = await attendanceRepo.upsert({
    classId,
    studentId,
    date: new Date(date),
    status,
    note: note ?? null,
    recordedById
  })

  await appendBlock({
    action: 'attendance.upsert',
    actorId: user.id,
    entity: 'attendance',
    entityId: saved.id,
    payload: { classId, studentId, date, status }
  })

  res.status(201).json(saved)
})

