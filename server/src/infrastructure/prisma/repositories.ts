import { prisma } from './client'
import type { ClassEntity, ClassRepository, EnrollmentEntity, EnrollmentRepository, StudentEntity, StudentRepository, TeacherEntity, TeacherRepository, UserRepository, AttendanceEntity, AttendanceRepository, AssignmentEntity, AssignmentRepository, GradeEntity, GradeRepository } from '../../domain/repositories'

export const userRepo: UserRepository = {
  async findByEmail(email) {
    const u = await prisma.user.findUnique({ where: { email } })
    return u ? { id: u.id, email: u.email, password: u.password, name: u.name, role: u.role as any, schoolId: u.schoolId } : null
  },
}

export const studentRepo: StudentRepository = {
  async list() {
    const rows = await prisma.student.findMany({ where: { deletedAt: null } })
    return rows as unknown as StudentEntity[]
  },
  async listBySchool(schoolId: string) {
    const rows = await prisma.student.findMany({ where: { deletedAt: null, schoolId } })
    return rows as unknown as StudentEntity[]
  },
  async create(data) {
    const { userId, schoolId, ...rest } = data as any
    const created = await prisma.student.create({
      data: {
        ...(userId ? { user: { connect: { id: userId } } } : { user: { create: { email: rest.email, password: '!', name: `${rest.firstName} ${rest.lastName}`, role: 'student' } } }),
        ...(schoolId ? { school: { connect: { id: schoolId } } } : {}),
        ...rest,
      } as any,
    })
    return created as unknown as StudentEntity
  },
  async getById(id) {
    const row = await prisma.student.findFirst({ where: { id, deletedAt: null } })
    return row as unknown as StudentEntity | null
  },
  async update(id, data) {
    const updated = await prisma.student.update({ where: { id }, data: { ...data } as any })
    return updated as unknown as StudentEntity
  },
  async softDelete(id) {
    await prisma.student.update({ where: { id }, data: { deletedAt: new Date() } })
    return true
  },
}

export const teacherRepo: TeacherRepository = {
  async list() {
    const rows = await prisma.teacher.findMany({ where: { deletedAt: null } })
    return rows as unknown as TeacherEntity[]
  },
  async listBySchool(schoolId: string) {
    const rows = await prisma.teacher.findMany({ where: { deletedAt: null, schoolId } })
    return rows as unknown as TeacherEntity[]
  },
  async create(data) {
    const created = await prisma.teacher.create({ data: { ...data } as any })
    return created as unknown as TeacherEntity
  },
  async getById(id) {
    const row = await prisma.teacher.findFirst({ where: { id, deletedAt: null } })
    return row as unknown as TeacherEntity | null
  },
  async update(id, data) {
    const updated = await prisma.teacher.update({ where: { id }, data: { ...data } as any })
    return updated as unknown as TeacherEntity
  },
  async softDelete(id) {
    await prisma.teacher.update({ where: { id }, data: { deletedAt: new Date() } })
    return true
  },
}

export const classRepo: ClassRepository = {
  async list() {
    const rows = await prisma.class.findMany({ where: { deletedAt: null } })
    return rows as unknown as ClassEntity[]
  },
  async listBySchool(schoolId: string) {
    const rows = await prisma.class.findMany({ where: { deletedAt: null, schoolId } })
    return rows as unknown as ClassEntity[]
  },
  async create(data) {
    const created = await prisma.class.create({ data: { ...data } as any })
    return created as unknown as ClassEntity
  },
  async getById(id) {
    const row = await prisma.class.findFirst({ where: { id, deletedAt: null } })
    return row as unknown as ClassEntity | null
  },
  async update(id, data) {
    const updated = await prisma.class.update({ where: { id }, data: { ...data } as any })
    return updated as unknown as ClassEntity
  },
  async softDelete(id) {
    await prisma.class.update({ where: { id }, data: { deletedAt: new Date() } })
    return true
  },
}

export const enrollmentRepo: EnrollmentRepository = {
  async listBySchool(schoolId: string) {
    const rows = await prisma.enrollment.findMany({
      where: { student: { schoolId }, class: { schoolId } },
    })
    return rows as unknown as EnrollmentEntity[]
  },
  async create(data) {
    const created = await prisma.enrollment.create({ data })
    return created as unknown as EnrollmentEntity
  },
  async delete(id) {
    await prisma.enrollment.delete({ where: { id } })
    return true
  },
}

export const attendanceRepo: AttendanceRepository = {
  async listForClass(classId, date) {
    const rows = await prisma.attendance.findMany({ where: { classId, ...(date ? { date } : {}) } })
    return rows as unknown as AttendanceEntity[]
  },
  async listForStudent(studentId) {
    const rows = await prisma.attendance.findMany({ where: { studentId } })
    return rows as unknown as AttendanceEntity[]
  },
  async upsert(entry) {
    const created = await prisma.attendance.upsert({
      where: { classId_studentId_date: { classId: entry.classId, studentId: entry.studentId, date: entry.date } },
      update: { status: entry.status as any, note: entry.note ?? null, recordedById: entry.recordedById ?? null },
      create: { ...entry } as any,
    })
    return created as unknown as AttendanceEntity
  },
}

export const assignmentRepo: AssignmentRepository = {
  async listForClass(classId) {
    const rows = await prisma.assignment.findMany({ where: { classId } })
    return rows as unknown as AssignmentEntity[]
  },
  async create(data) {
    const created = await prisma.assignment.create({ data: { ...data } as any })
    return created as unknown as AssignmentEntity
  },
  async update(id, data) {
    const updated = await prisma.assignment.update({ where: { id }, data: { ...data } as any })
    return updated as unknown as AssignmentEntity
  },
  async delete(id) {
    await prisma.assignment.delete({ where: { id } })
    return true
  },
}

export const gradeRepo: GradeRepository = {
  async listForAssignment(assignmentId) {
    const rows = await prisma.grade.findMany({ where: { assignmentId } })
    return rows as unknown as GradeEntity[]
  },
  async upsert(data) {
    const up = await prisma.grade.upsert({
      where: { assignmentId_studentId: { assignmentId: data.assignmentId, studentId: data.studentId } },
      update: { score: data.score, feedback: data.feedback ?? null, gradedAt: data.gradedAt ?? new Date() },
      create: { ...data } as any,
    })
    return up as unknown as GradeEntity
  },
}
