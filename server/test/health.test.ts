import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { appRouter } from '../src/routes'

const app = express()
app.use(express.json())
app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api', appRouter)

describe('health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

