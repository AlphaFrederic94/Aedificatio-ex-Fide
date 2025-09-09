import type { Role } from './types'

export interface UserEntity {
  id: string
  email: string
  password: string
  name: string
  role: Role
  schoolId?: string | null
}

export interface StudentEntity {
  id: string
  userId?: string
  schoolId?: string | null
  firstName: string
  lastName: string
  email: string
  grade: string
  dateOfBirth: Date
  enrollmentDate: Date
  status: 'active' | 'inactive' | 'graduated'
  parentName: string
  parentEmail: string
  parentPhone: string
  address: string
  deletedAt?: Date | null
}

export interface TeacherEntity {
  id: string
  userId: string
  schoolId?: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  subject: string
  hireDate: Date
  status: 'active' | 'inactive' | 'on-leave'
  qualification: string
  experience: number
  address: string
  emergencyContact: string
  emergencyPhone: string
  deletedAt?: Date | null
}

export interface ClassEntity {
  id: string
  schoolId?: string | null
  name: string
  subject: string
  grade: string
  teacherId: string
  teacherName: string
  room: string
  schedule: string
  startDate: Date
  endDate: Date
  description: string
  capacity: number
  status: 'active' | 'inactive'
  deletedAt?: Date | null
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>
}

export interface StudentRepository {
  list(): Promise<StudentEntity[]>
  listBySchool(schoolId: string): Promise<StudentEntity[]>
  create(data: Omit<StudentEntity, 'id' | 'deletedAt'>): Promise<StudentEntity>
  getById(id: string): Promise<StudentEntity | null>
  update(id: string, data: Partial<StudentEntity>): Promise<StudentEntity | null>
  softDelete(id: string): Promise<boolean>
}

export interface TeacherRepository {
  list(): Promise<TeacherEntity[]>
  listBySchool(schoolId: string): Promise<TeacherEntity[]>
  create(data: Omit<TeacherEntity, 'id' | 'deletedAt'>): Promise<TeacherEntity>
  getById(id: string): Promise<TeacherEntity | null>
  update(id: string, data: Partial<TeacherEntity>): Promise<TeacherEntity | null>
  softDelete(id: string): Promise<boolean>
}

export interface ClassRepository {
  list(): Promise<ClassEntity[]>
  listBySchool(schoolId: string): Promise<ClassEntity[]>
  create(data: Omit<ClassEntity, 'id' | 'deletedAt'>): Promise<ClassEntity>
  getById(id: string): Promise<ClassEntity | null>
  update(id: string, data: Partial<ClassEntity>): Promise<ClassEntity | null>
  softDelete(id: string): Promise<boolean>
}

export interface EnrollmentEntity {
  id: string
  studentId: string
  classId: string
  createdAt: Date
}

export interface EnrollmentRepository {
  listBySchool(schoolId: string): Promise<EnrollmentEntity[]>
  create(data: { studentId: string; classId: string }): Promise<EnrollmentEntity>
  delete(id: string): Promise<boolean>
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export interface AttendanceEntity {
  id: string
  classId: string
  studentId: string
  date: Date
  status: AttendanceStatus
  note?: string | null
  recordedById?: string | null
}
export interface AttendanceRepository {
  listForClass(classId: string, date?: Date): Promise<AttendanceEntity[]>
  listForStudent(studentId: string): Promise<AttendanceEntity[]>
  upsert(entry: Omit<AttendanceEntity, 'id'>): Promise<AttendanceEntity>
}

export interface AssignmentEntity {
  id: string
  classId: string
  title: string
  description: string
  dueDate: Date
  maxPoints: number
}
export interface AssignmentRepository {
  listForClass(classId: string): Promise<AssignmentEntity[]>
  create(data: Omit<AssignmentEntity, 'id'>): Promise<AssignmentEntity>
  update(id: string, data: Partial<AssignmentEntity>): Promise<AssignmentEntity | null>
  delete(id: string): Promise<boolean>
}

export interface GradeEntity {
  id: string
  assignmentId: string
  studentId: string
  score: number
  feedback?: string | null
  gradedAt: Date
}
export interface GradeRepository {
  listForAssignment(assignmentId: string): Promise<GradeEntity[]>
  upsert(data: Omit<GradeEntity, 'id' | 'gradedAt'> & { gradedAt?: Date }): Promise<GradeEntity>
}

