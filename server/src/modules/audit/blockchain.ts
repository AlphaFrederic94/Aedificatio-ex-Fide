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
  let prevHash = 'GENESIS'
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const expected = computeHash(r.index, prevHash, r.data as any, new Date(r.timestamp).getTime())
    if (expected !== r.hash) return { ok: false, at: r.index }
    prevHash = r.hash
  }
  return { ok: true }
}

