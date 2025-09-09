import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { enrollmentRepo, classRepo, studentRepo } from '../../infrastructure/prisma/repositories'
import { appendBlock } from '../audit/blockchain'
import { prisma } from '../../infrastructure/prisma/client'

export const enrollmentsRouter = Router()

// List enrollments for current school
enrollmentsRouter.get('/', requireRole(['admin', 'teacher']), async (req, res) => {
  const schoolId = (req as any).user.schoolId
  const rows = await enrollmentRepo.listBySchool(schoolId)
  res.json(rows)
})

// List enrollments for a specific student (students can only access their own)
enrollmentsRouter.get('/student/:studentId', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const { studentId } = req.params
  const user = (req as any).user
  if (user.role === 'student' && user.studentId !== studentId) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
  try {
    const rows = await prisma.enrollment.findMany({ where: { studentId } })
    res.json(rows)
  } catch (e) {
    console.error('enrollments/student error', e)
    res.status(500).json({ error: 'Failed to load enrollments' })
  }
})

// Enroll a student into a class
enrollmentsRouter.post('/', requireRole(['admin', 'teacher']), async (req, res) => {
  const { studentId, classId } = req.body || {}
  const schoolId = (req as any).user.schoolId
  if (!studentId || !classId) return res.status(400).json({ error: 'studentId and classId are required' })

  const s = await studentRepo.getById(studentId)
  const c = await classRepo.getById(classId)
  if (!s || !c || s.schoolId !== schoolId || c.schoolId !== schoolId) {
    return res.status(400).json({ error: 'Student and Class must belong to your school' })
  }

  // Prevent duplicate enrollment
  const existing = await prisma.enrollment.findFirst({ where: { studentId, classId } })
  if (existing) return res.status(409).json({ error: 'Student already enrolled in this class' })

  // Capacity check
  const currentCount = await prisma.enrollment.count({ where: { classId } })
  if (currentCount >= (c.capacity || 0)) {
    return res.status(400).json({ error: 'Class is at capacity' })
  }

  // Schedule conflict for the student (simple: same schedule string overlapping dates)
  const scheduleClash = await prisma.enrollment.findFirst({
    where: {
      studentId,
      class: {
        schoolId,
        schedule: c.schedule,
        deletedAt: null,
        startDate: { lte: c.endDate },
        endDate: { gte: c.startDate },
      },
    },
  })
  if (scheduleClash) return res.status(400).json({ error: 'Student has a schedule conflict with another class' })

  const created = await enrollmentRepo.create({ studentId, classId })
  await appendBlock({ action: 'enrollment.create', actorId: (req as any).user.id, entity: 'enrollment', entityId: created.id, payload: { studentId, classId } })
  res.status(201).json(created)
})

// Unenroll (hard delete)
enrollmentsRouter.delete('/:id', requireRole(['admin', 'teacher']), async (req, res) => {
  const ok = await enrollmentRepo.delete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Enrollment not found' })
  await appendBlock({ action: 'enrollment.delete', actorId: (req as any).user.id, entity: 'enrollment', entityId: req.params.id })
  res.json({ message: 'Enrollment deleted successfully' })
})

