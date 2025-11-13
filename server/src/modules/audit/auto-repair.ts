/**
 * Blockchain Auto-Repair System
 * Automatically detects and repairs tampered blocks
 */

import crypto from 'crypto'
import { prisma } from '../../infrastructure/prisma/client.ts'

interface RepairResult {
  blockIndex: number
  status: 'repaired' | 'failed'
  oldHash?: string
  newHash?: string
  error?: string
}

function computeHash(index: number, prevHash: string, data: any, timestamp: number): string {
  const raw = JSON.stringify({ index, prevHash, data, timestamp })
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Detect all tampered blocks
 */
export async function detectTamperedBlocks(): Promise<number[]> {
  const blocks = await prisma.auditBlock.findMany({
    orderBy: { index: 'asc' }
  })

  const tampered: number[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Check genesis block
    if (i === 0) {
      if (block.prevHash !== 'GENESIS') {
        tampered.push(block.index)
      }
    } else {
      // Check chain linking
      const prevBlock = blocks[i - 1]
      if (block.prevHash !== prevBlock.hash) {
        tampered.push(block.index)
        continue
      }
    }

    // Check hash integrity
    const expectedHash = computeHash(
      block.index,
      block.prevHash,
      block.data,
      new Date(block.timestamp).getTime()
    )

    if (expectedHash !== block.hash) {
      tampered.push(block.index)
    }
  }

  return tampered
}

/**
 * Auto-repair a single tampered block
 */
export async function repairBlock(blockIndex: number): Promise<RepairResult> {
  try {
    const block = await prisma.auditBlock.findFirst({
      where: { index: blockIndex }
    })

    if (!block) {
      return {
        blockIndex,
        status: 'failed',
        error: 'Block not found'
      }
    }

    const oldHash = block.hash

    // Get previous block for correct prevHash
    let correctPrevHash = 'GENESIS'
    if (blockIndex > 0) {
      const prevBlock = await prisma.auditBlock.findFirst({
        where: { index: blockIndex - 1 }
      })

      if (!prevBlock) {
        return {
          blockIndex,
          status: 'failed',
          error: 'Previous block not found'
        }
      }

      correctPrevHash = prevBlock.hash
    }

    // Compute correct hash
    const newHash = computeHash(
      block.index,
      correctPrevHash,
      block.data,
      new Date(block.timestamp).getTime()
    )

    // Update block
    await prisma.auditBlock.update({
      where: { id: block.id },
      data: {
        prevHash: correctPrevHash,
        hash: newHash
      }
    })

    return {
      blockIndex,
      status: 'repaired',
      oldHash,
      newHash
    }
  } catch (error: any) {
    return {
      blockIndex,
      status: 'failed',
      error: error.message
    }
  }
}

/**
 * Auto-repair all tampered blocks
 */
export async function autoRepairAll(): Promise<RepairResult[]> {
  const tampered = await detectTamperedBlocks()

  if (tampered.length === 0) {
    return []
  }

  const results: RepairResult[] = []

  // Repair from first tampered block onwards
  const startIndex = tampered[0]
  const blocks = await prisma.auditBlock.findMany({
    where: { index: { gte: startIndex } },
    orderBy: { index: 'asc' }
  })

  for (const block of blocks) {
    const result = await repairBlock(block.index)
    results.push(result)
  }

  return results
}

/**
 * Get repair status
 */
export async function getRepairStatus(): Promise<{
  totalBlocks: number
  tamperedBlocks: number[]
  canAutoRepair: boolean
  repairSummary: string
}> {
  const tampered = await detectTamperedBlocks()
  const totalBlocks = await prisma.auditBlock.count()

  return {
    totalBlocks,
    tamperedBlocks: tampered,
    canAutoRepair: tampered.length > 0,
    repairSummary: tampered.length === 0
      ? 'Blockchain is healthy'
      : `${tampered.length} block(s) tampered: ${tampered.join(', ')}`
  }
}

/**
 * Verify repair was successful
 */
export async function verifyRepair(): Promise<boolean> {
  const tampered = await detectTamperedBlocks()
  return tampered.length === 0
}
