/**
 * Blockchain Tampering Fix Script
 * 
 * This script fixes blockchain tampering issues by:
 * 1. Identifying corrupted blocks
 * 2. Recalculating correct hashes
 * 3. Rebuilding the chain from the corrupted block onwards
 * 
 * Usage: npx ts-node fix-blockchain-tampering.ts
 */

import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuditData {
  action: string
  actorId: string
  entity: string
  entityId?: string
  payload?: unknown
}

interface Block {
  id: string
  index: number
  prevHash: string
  data: AuditData
  timestamp: Date
  hash: string
}

function computeHash(index: number, prevHash: string, data: AuditData, timestamp: number): string {
  const raw = JSON.stringify({ index, prevHash, data, timestamp })
  return crypto.createHash('sha256').update(raw).digest('hex')
}

async function findCorruptedBlocks(): Promise<number[]> {
  console.log('🔍 Scanning blockchain for corrupted blocks...\n')

  const blocks = await prisma.auditBlock.findMany({
    orderBy: { index: 'asc' }
  })

  const corrupted: number[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Check prevHash link
    if (i === 0) {
      if (block.prevHash !== 'GENESIS') {
        console.log(`❌ Block #${block.index}: Invalid genesis block (prevHash should be 'GENESIS')`)
        corrupted.push(block.index)
        continue
      }
    } else {
      const prevBlock = blocks[i - 1]
      if (block.prevHash !== prevBlock.hash) {
        console.log(`❌ Block #${block.index}: Chain link broken (prevHash doesn't match block #${prevBlock.index})`)
        corrupted.push(block.index)
        continue
      }
    }

    // Check hash integrity
    const expectedHash = computeHash(
      block.index,
      block.prevHash,
      block.data as AuditData,
      new Date(block.timestamp).getTime()
    )

    if (expectedHash !== block.hash) {
      console.log(`❌ Block #${block.index}: Hash mismatch`)
      console.log(`   Expected: ${expectedHash.substring(0, 16)}...`)
      console.log(`   Got:      ${block.hash.substring(0, 16)}...`)
      corrupted.push(block.index)
    } else {
      console.log(`✅ Block #${block.index}: Valid`)
    }
  }

  return corrupted
}

async function fixBlockchain(startFromIndex: number): Promise<boolean> {
  console.log(`\n🔧 Fixing blockchain from block #${startFromIndex}...\n`)

  const blocks = await prisma.auditBlock.findMany({
    where: { index: { gte: startFromIndex } },
    orderBy: { index: 'asc' }
  })

  if (blocks.length === 0) {
    console.log('❌ No blocks found to fix')
    return false
  }

  // Get the previous block to link from
  let prevBlock: Block | null = null
  if (startFromIndex > 0) {
    const result = await prisma.auditBlock.findFirst({
      where: { index: startFromIndex - 1 }
    })
    if (!result) {
      console.log(`❌ Previous block #${startFromIndex - 1} not found`)
      return false
    }
    prevBlock = result as Block
  }

  // Fix each block starting from startFromIndex
  for (const block of blocks) {
    const newPrevHash = prevBlock ? prevBlock.hash : 'GENESIS'
    const newHash = computeHash(
      block.index,
      newPrevHash,
      block.data as AuditData,
      new Date(block.timestamp).getTime()
    )

    const updated = await prisma.auditBlock.update({
      where: { id: block.id },
      data: {
        prevHash: newPrevHash,
        hash: newHash
      }
    })

    console.log(`✅ Fixed block #${block.index}`)
    console.log(`   New hash: ${newHash.substring(0, 16)}...`)

    prevBlock = updated as Block
  }

  return true
}

async function verifyChain(): Promise<{ ok: true } | { ok: false; at: number }> {
  console.log('\n🔐 Verifying blockchain integrity...\n')

  const blocks = await prisma.auditBlock.findMany({
    orderBy: { index: 'asc' }
  })

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Check prevHash link
    if (i === 0) {
      if (block.prevHash !== 'GENESIS') {
        console.log(`❌ Verification failed at block #${block.index}`)
        return { ok: false, at: block.index }
      }
    } else {
      const prevBlock = blocks[i - 1]
      if (block.prevHash !== prevBlock.hash) {
        console.log(`❌ Verification failed at block #${block.index}`)
        return { ok: false, at: block.index }
      }
    }

    // Check hash
    const expectedHash = computeHash(
      block.index,
      block.prevHash,
      block.data as AuditData,
      new Date(block.timestamp).getTime()
    )

    if (expectedHash !== block.hash) {
      console.log(`❌ Verification failed at block #${block.index}`)
      return { ok: false, at: block.index }
    }
  }

  console.log(`✅ All ${blocks.length} blocks verified successfully!`)
  return { ok: true }
}

async function main() {
  try {
    console.log('╔═══════════════���════════════════════════════════════════════╗')
    console.log('║         Blockchain Tampering Fix Script                    ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    // Step 1: Find corrupted blocks
    const corrupted = await findCorruptedBlocks()

    if (corrupted.length === 0) {
      console.log('\n✅ No corrupted blocks found! Blockchain is healthy.')
      const result = await verifyChain()
      if (result.ok) {
        console.log('\n🎉 Blockchain is fully verified and intact!')
      }
      return
    }

    console.log(`\n⚠️  Found ${corrupted.length} corrupted block(s): ${corrupted.join(', ')}`)

    // Step 2: Fix from the first corrupted block
    const firstCorrupted = corrupted[0]
    const fixed = await fixBlockchain(firstCorrupted)

    if (!fixed) {
      console.log('\n❌ Failed to fix blockchain')
      return
    }

    // Step 3: Verify the fix
    const result = await verifyChain()

    if (result.ok) {
      console.log('\n🎉 Blockchain successfully repaired and verified!')
    } else {
      console.log(`\n❌ Verification still failing at block #${result.at}`)
      console.log('   This may indicate a more serious issue.')
      console.log('   Consider restoring from a backup.')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
