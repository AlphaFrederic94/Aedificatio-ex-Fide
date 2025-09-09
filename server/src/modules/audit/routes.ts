import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { appendBlock, verifyChain } from './blockchain'

export const auditRouter = Router()

auditRouter.get('/verify', requireRole(['admin']), async (_req, res) => {
  const result = await verifyChain()
  res.json(result)
})

