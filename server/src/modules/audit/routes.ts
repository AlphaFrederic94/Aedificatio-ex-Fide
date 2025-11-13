import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import {
  appendBlock,
  verifyChain,
  getBlockchainStats,
  getBlocks,
  getBlockByIndex,
  getEntityAuditTrail,
  getActorActivity,
  getRecentBlocks
} from './blockchain'
import {
  detectTamperedBlocks,
  repairBlock,
  autoRepairAll,
  getRepairStatus,
  verifyRepair
} from './auto-repair'

export const auditRouter = Router()

// Verify blockchain integrity (admin only)
auditRouter.get('/verify', requireRole(['admin']), async (_req, res) => {
  try {
    const result = await verifyChain()
    res.json(result)
  } catch (error) {
    console.error('Chain verification error:', error)
    res.status(500).json({ error: 'Failed to verify chain' })
  }
})

// Get blockchain statistics (admin only)
auditRouter.get('/stats', requireRole(['admin']), async (_req, res) => {
  try {
    const stats = await getBlockchainStats()
    res.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to get blockchain stats' })
  }
})

// Get all blocks with pagination and filters (admin only)
auditRouter.get('/blocks', requireRole(['admin']), async (req, res) => {
  try {
    const { page, limit, entity, action, actorId, startDate, endDate } = req.query

    const options: any = {}
    if (page) options.page = parseInt(page as string)
    if (limit) options.limit = parseInt(limit as string)
    if (entity) options.entity = entity as string
    if (action) options.action = action as string
    if (actorId) options.actorId = actorId as string
    if (startDate) options.startDate = new Date(startDate as string)
    if (endDate) options.endDate = new Date(endDate as string)

    const result = await getBlocks(options)
    res.json(result)
  } catch (error) {
    console.error('Get blocks error:', error)
    res.status(500).json({ error: 'Failed to get blocks' })
  }
})

// Get block by index (admin only)
auditRouter.get('/blocks/:index', requireRole(['admin']), async (req, res) => {
  try {
    const index = parseInt(req.params.index)
    const block = await getBlockByIndex(index)

    if (!block) {
      return res.status(404).json({ error: 'Block not found' })
    }

    res.json(block)
  } catch (error) {
    console.error('Get block error:', error)
    res.status(500).json({ error: 'Failed to get block' })
  }
})

// Get audit trail for specific entity (role-based access)
auditRouter.get('/entity/:entityType/:entityId', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  try {
    const { entityType, entityId } = req.params
    const user = (req as any).user

    // Access control: students can only see their own records
    if (user.role === 'student') {
      if (entityType === 'student' && entityId !== user.studentId) {
        return res.status(403).json({ error: 'Access denied' })
      }
      // Students can see their own submissions, enrollments, attendance
      const allowedEntities = ['student', 'submission', 'enrollment', 'attendance']
      if (!allowedEntities.includes(entityType)) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Teachers can see their own records and class-related records
    if (user.role === 'teacher') {
      if (entityType === 'teacher' && entityId !== user.teacherId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    const trail = await getEntityAuditTrail(entityType, entityId)
    res.json(trail)
  } catch (error) {
    console.error('Get entity audit trail error:', error)
    res.status(500).json({ error: 'Failed to get audit trail' })
  }
})

// Get actor activity (role-based access)
auditRouter.get('/actor/:actorId', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  try {
    const { actorId } = req.params
    const user = (req as any).user
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

    // Access control: users can only see their own activity (except admins)
    if (user.role !== 'admin' && actorId !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const activity = await getActorActivity(actorId, limit)
    res.json(activity)
  } catch (error) {
    console.error('Get actor activity error:', error)
    res.status(500).json({ error: 'Failed to get actor activity' })
  }
})

// Get recent blockchain activity (admin only)
auditRouter.get('/recent', requireRole(['admin']), async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
    const recent = await getRecentBlocks(limit)
    res.json(recent)
  } catch (error) {
    console.error('Get recent blocks error:', error)
    res.status(500).json({ error: 'Failed to get recent blocks' })
  }
})

// Detect tampered blocks (admin only)
auditRouter.get('/detect-tampering', requireRole(['admin']), async (_req, res) => {
  try {
    const tampered = await detectTamperedBlocks()
    res.json({
      tamperedBlocks: tampered,
      count: tampered.length,
      status: tampered.length === 0 ? 'healthy' : 'compromised'
    })
  } catch (error) {
    console.error('Tampering detection error:', error)
    res.status(500).json({ error: 'Failed to detect tampering' })
  }
})

// Get repair status (admin only)
auditRouter.get('/repair-status', requireRole(['admin']), async (_req, res) => {
  try {
    const status = await getRepairStatus()
    res.json(status)
  } catch (error) {
    console.error('Repair status error:', error)
    res.status(500).json({ error: 'Failed to get repair status' })
  }
})

// Repair a single block (admin only)
auditRouter.post('/repair-block/:index', requireRole(['admin']), async (req, res) => {
  try {
    const index = parseInt(req.params.index)
    const result = await repairBlock(index)

    if (result.status === 'failed') {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Block repair error:', error)
    res.status(500).json({ error: 'Failed to repair block' })
  }
})

// Auto-repair all tampered blocks (admin only)
auditRouter.post('/auto-repair', requireRole(['admin']), async (_req, res) => {
  try {
    const results = await autoRepairAll()

    // Verify repair was successful
    const verified = await verifyRepair()

    res.json({
      repaired: results.length,
      results,
      verified,
      status: verified ? 'success' : 'partial'
    })
  } catch (error) {
    console.error('Auto-repair error:', error)
    res.status(500).json({ error: 'Failed to auto-repair blockchain' })
  }
})

