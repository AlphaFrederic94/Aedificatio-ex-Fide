import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { teacherRepo } from '../../infrastructure/prisma/repositories'
import { appendBlock } from '../audit/blockchain'

export const teachersRouter = Router()

teachersRouter.get('/', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const schoolId = (req as any).user.schoolId
  const rows = schoolId ? await teacherRepo.listBySchool(schoolId) : await teacherRepo.list()
  res.json(rows)
})

teachersRouter.post('/', requireRole(['admin']), async (req, res) => {
  const d = req.body
  const schoolId = (req as any).user.schoolId
  const errors: Record<string, string> = {}
  const t = (v?: string) => (typeof v === 'string' ? v.trim() : '')
  if (!t(d.firstName)) errors.firstName = 'First name is required'
  if (!t(d.lastName)) errors.lastName = 'Last name is required'
  if (!t(d.email)) errors.email = 'Email is required'
  if (!t(d.phone)) errors.phone = 'Phone is required'
  if (!t(d.department)) errors.department = 'Department is required'
  if (!t(d.subject)) errors.subject = 'Subject is required'
  if (!t(d.hireDate)) errors.hireDate = 'Hire date is required'
  if (!t(d.qualification)) errors.qualification = 'Qualification is required'
  if (typeof d.experience !== 'number' || d.experience < 0) errors.experience = 'Experience must be a positive number'
  if (!t(d.address)) errors.address = 'Address is required'
  if (!t(d.emergencyContact)) errors.emergencyContact = 'Emergency contact is required'
  if (!t(d.emergencyPhone)) errors.emergencyPhone = 'Emergency phone is required'
  if (Object.keys(errors).length) return res.status(400).json({ errors })

  const created = await teacherRepo.create({
    userId: d.userId || '',
    schoolId,
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone,
    department: d.department,
    subject: d.subject,
    hireDate: new Date(d.hireDate),
    status: 'active',
    qualification: d.qualification,
    experience: d.experience,
    address: d.address,
    emergencyContact: d.emergencyContact,
    emergencyPhone: d.emergencyPhone,
  })
  await appendBlock({ action: 'teacher.create', actorId: (req as any).user.id, entity: 'teacher', entityId: created.id, payload: { ...d } })

  res.status(201).json(created)
})

teachersRouter.get('/:id', requireRole(['admin']), async (req, res) => {
  const trow = await teacherRepo.getById(req.params.id)
  if (!trow) return res.status(404).json({ error: 'Teacher not found' })
  res.json(trow)
})

teachersRouter.put('/:id', requireRole(['admin']), async (req, res) => {
  const updated = await teacherRepo.update(req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Teacher not found' })
  await appendBlock({ action: 'teacher.update', actorId: (req as any).user.id, entity: 'teacher', entityId: updated.id, payload: { ...req.body } })
  res.json(updated)
})

teachersRouter.delete('/:id', requireRole(['admin']), async (req, res) => {
  await teacherRepo.softDelete(req.params.id)
  await appendBlock({ action: 'teacher.delete', actorId: (req as any).user.id, entity: 'teacher', entityId: req.params.id })
  res.json({ message: 'Teacher deleted successfully' })
})

