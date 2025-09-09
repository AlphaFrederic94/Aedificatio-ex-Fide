import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { appRouter } from '../src/routes'

const app = express()
app.use(express.json())
app.use('/api', appRouter)

async function signup(position: 'admin' | 'teacher' | 'student', schoolName = 'Attendance High') {
  const email = `${position}.${Math.random().toString(36).slice(2)}@school.edu`
  const res = await request(app)
    .post('/api/signup')
    .send({ firstName: 'F', lastName: 'L', email, password: 'p4ssw0rd!', schoolName, position })
  return { token: res.body.token as string, user: res.body.user }
}

describe('attendance', () => {
  it('records and fetches attendance with upsert semantics', async () => {
    // same school
    const { token: adminToken, user: admin } = await signup('admin', 'Attend U')
    const { user: teacher } = await signup('teacher', 'Attend U')
    const { user: student } = await signup('student', 'Attend U')

    // create a class for the teacher
    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'History', subject: 'Social', grade: '10', teacherId: teacher.teacherId,
        room: '201', schedule: 'TTh 10:00-11:00', startDate: '2025-09-01', endDate: '2026-06-01', description: 'World history', capacity: 35,
      })
    expect(classRes.status).toBe(201)
    const classId = classRes.body.id as string

    const date = '2025-10-01'

    // record attendance
    const a1 = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classId, studentId: student.studentId, date, status: 'present' })
    expect(a1.status).toBe(201)
    expect(a1.body.status).toBe('present')

    // upsert (change status)
    const a2 = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classId, studentId: student.studentId, date, status: 'absent', note: 'Sick' })
    expect(a2.status).toBe(201)
    expect(a2.body.status).toBe('absent')

    // fetch by class/date
    const listByClass = await request(app)
      .get(`/api/attendance/class/${classId}?date=${date}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(listByClass.status).toBe(200)
    expect(Array.isArray(listByClass.body)).toBe(true)
    expect(listByClass.body[0].status).toBe('absent')

    // fetch by student
    const listByStudent = await request(app)
      .get(`/api/attendance/student/${student.studentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(listByStudent.status).toBe(200)
    expect(Array.isArray(listByStudent.body)).toBe(true)
    expect(listByStudent.body.length).toBeGreaterThan(0)
  })

  it('rejects cross-school attendance entries', async () => {
    const { token: adminA } = await signup('admin', 'School A')
    const { user: teacherA } = await signup('teacher', 'School A')
    const { user: studentB } = await signup('student', 'School B')

    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${adminA}`)
      .send({
        name: 'Biology', subject: 'Science', grade: '11', teacherId: teacherA.teacherId,
        room: 'B1', schedule: 'MWF 8:00-9:00', startDate: '2025-09-01', endDate: '2026-06-01', description: 'Biology basics', capacity: 25,
      })
    expect(classRes.status).toBe(201)

    const bad = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${adminA}`)
      .send({ classId: classRes.body.id, studentId: studentB.studentId, date: '2025-10-02', status: 'present' })
    expect(bad.status).toBe(400)
  })
})

