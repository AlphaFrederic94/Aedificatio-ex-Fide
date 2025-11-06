import crypto from 'crypto'
import { prisma } from '../../infrastructure/prisma/client'

export interface AuditData {
  action: string
  actorId: string
  entity: string
  entityId?: string
  payload?: unknown
}

export interface Block {
  index: number
  prevHash: string
  data: AuditData
  timestamp: number
  hash: string
}

function computeHash(index: number, prevHash: string, data: AuditData, timestamp: number) {
  const raw = JSON.stringify({ index, prevHash, data, timestamp })
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function getLatestBlock(): Promise<Block | null> {
  const row = await prisma.auditBlock.findFirst({ orderBy: { index: 'desc' } })
  if (!row) return null
  return { index: row.index, prevHash: row.prevHash, data: row.data as any, timestamp: new Date(row.timestamp).getTime(), hash: row.hash }
}

export async function appendBlock(data: AuditData): Promise<Block> {
  const latest = await getLatestBlock()
  const index = latest ? latest.index + 1 : 0
  const prevHash = latest ? latest.hash : 'GENESIS'
  const timestamp = Date.now()
  const hash = computeHash(index, prevHash, data, timestamp)
  const saved = await prisma.auditBlock.create({ data: { index, prevHash, data: data as any, timestamp: new Date(timestamp), hash } })
  return { index: saved.index, prevHash: saved.prevHash, data, timestamp, hash }
}

export async function verifyChain(): Promise<{ ok: true } | { ok: false; at: number } > {
  const rows = await prisma.auditBlock.findMany({ orderBy: { index: 'asc' } })

  // Verify chain integrity by checking prevHash links
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]

    // First block should have prevHash = 'GENESIS'
    if (i === 0) {
      if (r.prevHash !== 'GENESIS') {
        return { ok: false, at: r.index }
      }
    } else {
      // Subsequent blocks should have prevHash = previous block's hash
      const prevBlock = rows[i - 1]
      if (r.prevHash !== prevBlock.hash) {
        return { ok: false, at: r.index }
      }
    }

    // Verify the hash is correctly computed for this block
    const expectedHash = computeHash(r.index, r.prevHash, r.data as any, new Date(r.timestamp).getTime())
    if (expectedHash !== r.hash) {
      return { ok: false, at: r.index }
    }
  }

  return { ok: true }
}

// Get genesis block
export async function getGenesisBlock(): Promise<Block | null> {
  const row = await prisma.auditBlock.findFirst({ where: { index: 0 }, orderBy: { index: 'asc' } })
  if (!row) return null
  return { index: row.index, prevHash: row.prevHash, data: row.data as any, timestamp: new Date(row.timestamp).getTime(), hash: row.hash }
}

// Get total block count
export async function getBlockCount(): Promise<number> {
  return await prisma.auditBlock.count()
}

// Get blocks with pagination and filters
export async function getBlocks(options: {
  page?: number
  limit?: number
  entity?: string
  action?: string
  actorId?: string
  startDate?: Date
  endDate?: Date
}): Promise<{ blocks: Block[]; total: number; page: number; totalPages: number }> {
  const page = options.page || 1
  const limit = options.limit || 50
  const skip = (page - 1) * limit

  const where: any = {}

  if (options.entity || options.action || options.actorId) {
    where.data = {}
    if (options.entity) where.data.path = ['entity']
    if (options.action) where.data.path = ['action']
    if (options.actorId) where.data.path = ['actorId']
  }

  if (options.startDate || options.endDate) {
    where.timestamp = {}
    if (options.startDate) where.timestamp.gte = options.startDate
    if (options.endDate) where.timestamp.lte = options.endDate
  }

  // For JSON filtering, we need to use raw query or filter in memory
  let rows = await prisma.auditBlock.findMany({
    orderBy: { index: 'desc' },
    ...(options.startDate || options.endDate ? { where: { timestamp: where.timestamp } } : {})
  })

  // Filter by JSON fields in memory
  if (options.entity) {
    rows = rows.filter(r => (r.data as any).entity === options.entity)
  }
  if (options.action) {
    rows = rows.filter(r => (r.data as any).action === options.action)
  }
  if (options.actorId) {
    rows = rows.filter(r => (r.data as any).actorId === options.actorId)
  }

  const total = rows.length
  const paginatedRows = rows.slice(skip, skip + limit)

  const blocks = paginatedRows.map(r => ({
    index: r.index,
    prevHash: r.prevHash,
    data: r.data as any,
    timestamp: new Date(r.timestamp).getTime(),
    hash: r.hash
  }))

  return {
    blocks,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

// Get block by index
export async function getBlockByIndex(index: number): Promise<Block | null> {
  const row = await prisma.auditBlock.findFirst({ where: { index } })
  if (!row) return null
  return { index: row.index, prevHash: row.prevHash, data: row.data as any, timestamp: new Date(row.timestamp).getTime(), hash: row.hash }
}

// Get audit trail for specific entity
export async function getEntityAuditTrail(entityType: string, entityId: string): Promise<Block[]> {
  const rows = await prisma.auditBlock.findMany({
    orderBy: { index: 'desc' }
  })

  const filtered = rows.filter(r => {
    const data = r.data as any
    return data.entity === entityType && data.entityId === entityId
  })

  return filtered.map(r => ({
    index: r.index,
    prevHash: r.prevHash,
    data: r.data as any,
    timestamp: new Date(r.timestamp).getTime(),
    hash: r.hash
  }))
}

// Get actor activity
export async function getActorActivity(actorId: string, limit?: number): Promise<Block[]> {
  const rows = await prisma.auditBlock.findMany({
    orderBy: { index: 'desc' },
    ...(limit ? { take: limit } : {})
  })

  const filtered = rows.filter(r => (r.data as any).actorId === actorId)

  return filtered.map(r => ({
    index: r.index,
    prevHash: r.prevHash,
    data: r.data as any,
    timestamp: new Date(r.timestamp).getTime(),
    hash: r.hash
  }))
}

// Get recent blocks
export async function getRecentBlocks(limit: number = 20): Promise<Block[]> {
  const rows = await prisma.auditBlock.findMany({
    orderBy: { index: 'desc' },
    take: limit
  })

  return rows.map(r => ({
    index: r.index,
    prevHash: r.prevHash,
    data: r.data as any,
    timestamp: new Date(r.timestamp).getTime(),
    hash: r.hash
  }))
}

// Get blockchain statistics
export async function getBlockchainStats(): Promise<{
  totalBlocks: number
  chainStatus: 'verified' | 'tampered'
  lastVerification: number
  genesisBlock: Block | null
  blocksByEntity: Record<string, number>
  blocksByAction: Record<string, number>
}> {
  const totalBlocks = await getBlockCount()
  const verificationResult = await verifyChain()
  const genesisBlock = await getGenesisBlock()

  const allBlocks = await prisma.auditBlock.findMany()

  const blocksByEntity: Record<string, number> = {}
  const blocksByAction: Record<string, number> = {}

  allBlocks.forEach(block => {
    const data = block.data as any
    blocksByEntity[data.entity] = (blocksByEntity[data.entity] || 0) + 1
    blocksByAction[data.action] = (blocksByAction[data.action] || 0) + 1
  })

  return {
    totalBlocks,
    chainStatus: verificationResult.ok ? 'verified' : 'tampered',
    lastVerification: Date.now(),
    genesisBlock,
    blocksByEntity,
    blocksByAction
  }
}

