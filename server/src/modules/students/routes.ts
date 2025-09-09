import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { studentRepo } from '../../infrastructure/prisma/repositories'
import { appendBlock } from '../audit/blockchain'

export const studentsRouter = Router()

studentsRouter.get('/', requireRole(['admin', 'teacher']), async (req, res) => {
  const schoolId = (req as any).user.schoolId
  const students = schoolId ? await studentRepo.listBySchool(schoolId) : await studentRepo.list()
  res.json(students)
})

studentsRouter.post('/', requireRole(['admin']), async (req, res) => {
  const data = req.body
  const schoolId = (req as any).user.schoolId
  const errors: Record<string, string> = {}
  const trim = (v?: string) => (typeof v === 'string' ? v.trim() : '')
  if (!trim(data.firstName)) errors.firstName = 'First name is required'
  if (!trim(data.lastName)) errors.lastName = 'Last name is required'
  if (!trim(data.email)) errors.email = 'Email is required'
  if (!trim(data.grade)) errors.grade = 'Grade is required'
  if (!trim(data.dateOfBirth)) errors.dateOfBirth = 'Date of birth is required'
  if (!trim(data.enrollmentDate)) errors.enrollmentDate = 'Enrollment date is required'
  if (!trim(data.parentName)) errors.parentName = 'Parent name is required'
  if (!trim(data.parentEmail)) errors.parentEmail = 'Parent email is required'
  if (!trim(data.parentPhone)) errors.parentPhone = 'Parent phone is required'
  if (!trim(data.address)) errors.address = 'Address is required'
  if (Object.keys(errors).length) return res.status(400).json({ errors })

  const created = await studentRepo.create({
    ...(data.userId ? { userId: data.userId } : {}),
    schoolId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    grade: data.grade,
    dateOfBirth: new Date(data.dateOfBirth),
    enrollmentDate: new Date(data.enrollmentDate),
    status: 'active',
    parentName: data.parentName,
    parentEmail: data.parentEmail,
    parentPhone: data.parentPhone,
    address: data.address,
  })
  await appendBlock({ action: 'student.create', actorId: (req as any).user.id, entity: 'student', entityId: created.id, payload: { ...data } })

  res.status(201).json(created)
})

studentsRouter.get('/:id', requireRole(['admin', 'teacher']), async (req, res) => {
  const s = await studentRepo.getById(req.params.id)
  if (!s) return res.status(404).json({ error: 'Student not found' })
  res.json(s)
})

studentsRouter.put('/:id', requireRole(['admin']), async (req, res) => {
  const d = req.body || {}
  const updateData: any = { ...d }
  if (d.dateOfBirth) updateData.dateOfBirth = new Date(d.dateOfBirth)
  if (d.enrollmentDate) updateData.enrollmentDate = new Date(d.enrollmentDate)
  const s = await studentRepo.update(req.params.id, updateData)
  if (!s) return res.status(404).json({ error: 'Student not found' })
  await appendBlock({ action: 'student.update', actorId: (req as any).user.id, entity: 'student', entityId: s.id, payload: { ...d } })
  res.json(s)
})

studentsRouter.delete('/:id', requireRole(['admin']), async (req, res) => {
  const ok = await studentRepo.softDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Student not found' })
  await appendBlock({ action: 'student.delete', actorId: (req as any).user.id, entity: 'student', entityId: req.params.id })
  res.json({ message: 'Student deleted successfully' })
})

