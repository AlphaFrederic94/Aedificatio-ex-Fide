import { Router } from 'express'
import { prisma } from '../../infrastructure/prisma/client'
import { hashPassword } from '../auth/password'
import { slugify } from '../../lib/slug'
import { signToken } from '../auth/jwt'

export const signupRouter = Router()

signupRouter.post('/', async (req, res) => {
  const { firstName, lastName, email, password, schoolName, position } = req.body || {}
  if (!firstName || !lastName || !email || !password || !schoolName || !position) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  if (!['admin', 'teacher', 'student'].includes(position)) {
    return res.status(400).json({ error: 'Invalid position' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'Email already exists' })

  // find or create school
  const slug = slugify(String(schoolName))
  const school = await prisma.school.upsert({
    where: { slug },
    update: {},
    create: { name: schoolName, slug },
  })

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { email, password: passwordHash, name: `${firstName} ${lastName}`, role: position, schoolId: school.id },
  })

  // create profile by role
  if (position === 'teacher') {
    await prisma.teacher.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        firstName,
        lastName,
        email,
        phone: '',
        department: '',
        subject: '',
        hireDate: new Date(),
        qualification: '',
        experience: 0,
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
      },
    })
  }
  if (position === 'student') {
    await prisma.student.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        firstName,
        lastName,
        email,
        grade: '',
        dateOfBirth: new Date('2000-01-01'),
        enrollmentDate: new Date(),
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        address: '',
      },
    })
  }

  const payload: any = { id: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId }
  if (position === 'teacher') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } })
    payload.teacherId = t?.id
    payload.department = t?.department
  }
  if (position === 'student') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } })
    payload.studentId = s?.id
    payload.grade = s?.grade
  }

  const token = await signToken(payload)
  return res.status(201).json({ token, user: payload })
})

