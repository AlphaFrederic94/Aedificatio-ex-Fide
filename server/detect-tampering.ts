/**
 * Blockchain Tampering Detection Script
 * Scans for all tampered blocks and reports details
 */

import crypto from 'crypto'
import { prisma } from './src/infrastructure/prisma/client.ts'

interface TamperedBlock {
  index: number
  issue: string
  details: any
}

function computeHash(index: number, prevHash: string, data: any, timestamp: number) {
  const raw = JSON.stringify({ index, prevHash, data, timestamp })
  return crypto.createHash('sha256').update(raw).digest('hex')
}

async function detectTampering() {
  console.log('🔍 Scanning blockchain for tampered blocks...\n')

  const blocks = await prisma.auditBlock.findMany({
    orderBy: { index: 'asc' }
  })

  const tampered: TamperedBlock[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Check 1: Genesis block validation
    if (i === 0) {
      if (block.prevHash !== 'GENESIS') {
        tampered.push({
          index: block.index,
          issue: 'Invalid genesis block',
          details: { expected: 'GENESIS', got: block.prevHash }
        })
        console.log(`❌ Block #${block.index}: Invalid genesis block`)
        continue
      }
    } else {
      // Check 2: Chain linking
      const prevBlock = blocks[i - 1]
      if (block.prevHash !== prevBlock.hash) {
        tampered.push({
          index: block.index,
          issue: 'Chain link broken',
          details: {
            expected: prevBlock.hash.substring(0, 16) + '...',
            got: block.prevHash.substring(0, 16) + '...'
          }
        })
        console.log(`❌ Block #${block.index}: Chain link broken`)
        console.log(`   Expected prevHash: ${prevBlock.hash.substring(0, 16)}...`)
        console.log(`   Got prevHash: ${block.prevHash.substring(0, 16)}...`)
        continue
      }
    }

    // Check 3: Hash integrity
    const expectedHash = computeHash(
      block.index,
      block.prevHash,
      block.data,
      new Date(block.timestamp).getTime()
    )

    if (expectedHash !== block.hash) {
      tampered.push({
        index: block.index,
        issue: 'Hash mismatch',
        details: {
          expected: expectedHash.substring(0, 16) + '...',
          got: block.hash.substring(0, 16) + '...'
        }
      })
      console.log(`❌ Block #${block.index}: Hash mismatch`)
      console.log(`   Expected: ${expectedHash.substring(0, 16)}...`)
      console.log(`   Got: ${block.hash.substring(0, 16)}...`)
    } else {
      console.log(`✅ Block #${block.index}: Valid`)
    }
  }

  console.log('\n' + '═'.repeat(60))
  console.log(`\n📊 TAMPERING DETECTION REPORT`)
  console.log(`   Total Blocks: ${blocks.length}`)
  console.log(`   Tampered Blocks: ${tampered.length}`)
  console.log(`   Integrity: ${tampered.length === 0 ? '✅ VERIFIED' : '❌ COMPROMISED'}`)

  if (tampered.length > 0) {
    console.log(`\n🚨 Tampered Blocks:`)
    tampered.forEach(t => {
      console.log(`   Block #${t.index}: ${t.issue}`)
    })
  }

  console.log('\n' + '═'.repeat(60) + '\n')

  await prisma.$disconnect()
}

detectTampering().catch(console.error)
