import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { classRepo, teacherRepo } from '../../infrastructure/prisma/repositories'
import { appendBlock } from '../audit/blockchain'
import { prisma } from '../../infrastructure/prisma/client'

export const classesRouter = Router()

classesRouter.get('/', async (req, res) => {
  const schoolId = (req as any).user?.schoolId
  const user = (req as any).user

  try {
    let classes
    if (schoolId) {
      // Students can only see approved classes
      if (user?.role === 'student') {
        classes = await prisma.class.findMany({
          where: {
            schoolId,
            status: { in: ['approved', 'active'] },
            deletedAt: null
          },
          include: {
            teacher: true,
            _count: {
              select: { enrolledStudents: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      } else {
        // Teachers and admins can see all classes
        classes = await classRepo.listBySchool(schoolId)
      }
    } else {
      classes = await classRepo.list()
    }

    res.json(classes)
  } catch (error) {
    console.error('Get classes error:', error)
    res.status(500).json({ error: 'Failed to get classes' })
  }
})

// Approve/reject a class (admin only)
classesRouter.patch('/:id/status', requireRole(['admin']), async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const user = (req as any).user

  if (!['approved', 'rejected', 'active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const existingClass = await prisma.class.findUnique({ where: { id } })
    if (!existingClass) {
      return res.status(404).json({ error: 'Class not found' })
    }

    // Ensure class belongs to same school
    if (existingClass.schoolId !== user.schoolId) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: { status },
      include: {
        teacher: true,
        _count: {
          select: { enrolledStudents: true }
        }
      }
    })

    // Log the approval/rejection
    await appendBlock({
      action: `class_${status}`,
      entity: 'class',
      entityId: id,
      actorId: user.id,
      payload: { classId: id, status, previousStatus: existingClass.status }
    })

    res.json(updatedClass)
  } catch (error) {
    console.error('Update class status error:', error)
    res.status(500).json({ error: 'Failed to update class status' })
  }
})

classesRouter.post('/', requireRole(['admin']), async (req, res) => {
  const d = req.body
  const schoolId = (req as any).user.schoolId
  const errors: Record<string, string> = {}
  const t = (v?: string) => (typeof v === 'string' ? v.trim() : '')
  if (!t(d.name)) errors.name = 'Class name is required'
  if (!t(d.subject)) errors.subject = 'Subject is required'
  if (!t(d.grade)) errors.grade = 'Grade is required'
  if (!t(d.teacherId)) errors.teacherId = 'Teacher is required'
  if (!t(d.room)) errors.room = 'Room is required'
  if (!t(d.schedule)) errors.schedule = 'Schedule is required'
  if (!t(d.startDate)) errors.startDate = 'Start date is required'
  if (!t(d.endDate)) errors.endDate = 'End date is required'
  if (!t(d.description)) errors.description = 'Description is required'
  if (typeof d.capacity !== 'number' || d.capacity < 1 || d.capacity > 50) errors.capacity = 'Capacity must be between 1 and 50'
  if (Object.keys(errors).length) return res.status(400).json({ errors })

  const trow = await teacherRepo.getById(d.teacherId)
  const teacherName = trow ? `${trow.firstName} ${trow.lastName}` : 'Unknown Teacher'

  const created = await classRepo.create({
    schoolId,
    name: d.name,
    subject: d.subject,
    grade: d.grade,
    teacherId: d.teacherId,
    teacherName,
    room: d.room,
    schedule: d.schedule,
    startDate: new Date(d.startDate),
    endDate: new Date(d.endDate),
    description: d.description,
    capacity: d.capacity,
    status: 'active',
  })
  await appendBlock({ action: 'class.create', actorId: (req as any).user.id, entity: 'class', entityId: created.id, payload: { ...d } })
  res.status(201).json(created)
})

classesRouter.get('/:id', async (req, res) => {
  const row = await classRepo.getById(req.params.id)
  if (!row) return res.status(404).json({ error: 'Class not found' })
  res.json(row)
})

classesRouter.put('/:id', requireRole(['admin']), async (req, res) => {
  const d = req.body
  let teacherName: string | undefined
  if (d.teacherId) {
    const trow = await teacherRepo.getById(d.teacherId)
    teacherName = trow ? `${trow.firstName} ${trow.lastName}` : 'Unknown Teacher'
  }
  const updated = await classRepo.update(req.params.id, { ...d, ...(teacherName ? { teacherName } : {}) })
  if (!updated) return res.status(404).json({ error: 'Class not found' })
  await appendBlock({ action: 'class.update', actorId: (req as any).user.id, entity: 'class', entityId: updated.id, payload: { ...d } })
  res.json(updated)
})

classesRouter.delete('/:id', requireRole(['admin']), async (req, res) => {
  const ok = await classRepo.softDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Class not found' })
  await appendBlock({ action: 'class.delete', actorId: (req as any).user.id, entity: 'class', entityId: req.params.id })
  res.json({ message: 'Class deleted successfully' })
})

