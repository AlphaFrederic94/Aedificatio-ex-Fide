import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { appRouter } from '../src/routes'

const app = express()
app.use(express.json())
app.use('/api', appRouter)

const base = {
  firstName: 'Alice',
  lastName: 'Nguyen',
  schoolName: 'Lincoln High School',
}

describe('signup', () => {
  it('creates a teacher account scoped to school', async () => {
    const email = `alice.${Date.now()}@school.edu`
    const res = await request(app)
      .post('/api/signup')
      .send({ ...base, email, password: 'strongpass', position: 'teacher' })
    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('teacher')
    expect(res.body.user.email).toBe(email)
  })
})

