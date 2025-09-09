import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { appRouter } from '../src/routes'

const app = express()
app.use(express.json())
app.use('/api', appRouter)

async function loginAdmin() {
  const res = await request(app).post('/api/auth').send({ email: 'admin@school.edu', password: 'admin123' })
  return res.body.token as string
}

describe('students', () => {
  it('lists students for admin', async () => {
    const token = await loginAdmin()
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

