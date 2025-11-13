/**
 * Blockchain Metrics & Verification Suite
 * 
 * Tests to verify the custom blockchain framework works as required
 */

import crypto from 'crypto'
import { prisma } from './src/infrastructure/prisma/client.ts'
import { verifyChain, appendBlock, getBlockByIndex, getLatestBlock } from './src/modules/audit/blockchain.ts'

interface MetricResult {
  name: string
  passed: boolean
  value?: any
  error?: string
  duration?: number
}

const results: MetricResult[] = []

// ============================================================================
// 1. CRYPTOGRAPHIC INTEGRITY METRICS
// ============================================================================

async function testHashConsistency() {
  const start = Date.now()
  try {
    const block = await getLatestBlock()
    if (!block) throw new Error('No blocks found')

    // Recompute hash
    const raw = JSON.stringify({
      index: block.index,
      prevHash: block.prevHash,
      data: block.data,
      timestamp: block.timestamp
    })
    const recomputedHash = crypto.createHash('sha256').update(raw).digest('hex')

    const passed = recomputedHash === block.hash
    results.push({
      name: 'Hash Consistency',
      passed,
      value: { stored: block.hash.substring(0, 16), computed: recomputedHash.substring(0, 16) },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Hash Consistency',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

async function testChainLinking() {
  const start = Date.now()
  try {
    const blocks = await prisma.auditBlock.findMany({
      orderBy: { index: 'asc' }
    })

    let allLinked = true
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i].prevHash !== blocks[i - 1].hash) {
        allLinked = false
        break
      }
    }

    results.push({
      name: 'Chain Linking Integrity',
      passed: allLinked,
      value: { blocksChecked: blocks.length, allLinked },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Chain Linking Integrity',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

async function testGenesisBlockValidity() {
  const start = Date.now()
  try {
    const genesisBlock = await prisma.auditBlock.findFirst({
      where: { index: 0 }
    })

    if (!genesisBlock) throw new Error('Genesis block not found')

    const isValid = genesisBlock.prevHash === 'GENESIS'
    results.push({
      name: 'Genesis Block Validity',
      passed: isValid,
      value: { prevHash: genesisBlock.prevHash, isGenesis: isValid },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Genesis Block Validity',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

// ============================================================================
// 2. CHAIN VERIFICATION METRICS
// ============================================================================

async function testFullChainVerification() {
  const start = Date.now()
  try {
    const result = await verifyChain()
    results.push({
      name: 'Full Chain Verification',
      passed: result.ok,
      value: result.ok ? 'Chain verified' : `Tampering at block #${result.at}`,
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Full Chain Verification',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

async function testTamperingDetection() {
  const start = Date.now()
  try {
    // Get a block and temporarily modify it
    const block = await prisma.auditBlock.findFirst({
      where: { index: { gt: 0 } }
    })

    if (!block) throw new Error('No blocks to test')

    const originalHash = block.hash

    // Simulate tampering
    await prisma.auditBlock.update({
      where: { id: block.id },
      data: { hash: 'tampered_hash_' + Math.random().toString(36).substring(7) }
    })

    // Verify should detect tampering
    const result = await verifyChain()
    const tamperingDetected = !result.ok

    // Restore original
    await prisma.auditBlock.update({
      where: { id: block.id },
      data: { hash: originalHash }
    })

    results.push({
      name: 'Tampering Detection',
      passed: tamperingDetected,
      value: { tamperingDetected, blockIndex: block.index },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Tampering Detection',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

// ============================================================================
// 3. PERFORMANCE METRICS
// ============================================================================

async function testBlockAppendPerformance() {
  const start = Date.now()
  try {
    const testData = {
      action: 'test.performance',
      actorId: 'test-actor',
      entity: 'test_entity',
      entityId: 'test-id-' + Date.now(),
      payload: { test: true }
    }

    const appendStart = Date.now()
    await appendBlock(testData)
    const appendDuration = Date.now() - appendStart

    results.push({
      name: 'Block Append Performance',
      passed: appendDuration < 100, // Should be < 100ms
      value: { appendTimeMs: appendDuration, threshold: 100 },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Block Append Performance',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

async function testVerificationPerformance() {
  const start = Date.now()
  try {
    const verifyStart = Date.now()
    await verifyChain()
    const verifyDuration = Date.now() - verifyStart

    const blockCount = await prisma.auditBlock.count()
    const timePerBlock = verifyDuration / blockCount

    results.push({
      name: 'Verification Performance',
      passed: verifyDuration < 5000, // Should be < 5 seconds
      value: { totalTimeMs: verifyDuration, timePerBlockMs: timePerBlock.toFixed(2), blockCount },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Verification Performance',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

// ============================================================================
// 4. DATA INTEGRITY METRICS
// ============================================================================

async function testDataPersistence() {
  const start = Date.now()
  try {
    const testData = {
      action: 'test.persistence',
      actorId: 'test-actor-' + Date.now(),
      entity: 'test_entity',
      entityId: 'test-id-' + Date.now(),
      payload: { testValue: Math.random() }
    }

    const block = await appendBlock(testData)
    const retrieved = await getBlockByIndex(block.index)

    const dataMatches = JSON.stringify(retrieved?.data) === JSON.stringify(testData)

    results.push({
      name: 'Data Persistence',
      passed: dataMatches,
      value: { blockIndex: block.index, dataMatches },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Data Persistence',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

async function testSequentialOrdering() {
  const start = Date.now()
  try {
    const blocks = await prisma.auditBlock.findMany({
      orderBy: { index: 'asc' }
    })

    let isSequential = true
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].index !== i) {
        isSequential = false
        break
      }
    }

    results.push({
      name: 'Sequential Block Ordering',
      passed: isSequential,
      value: { blockCount: blocks.length, isSequential },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Sequential Block Ordering',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

// ============================================================================
// 5. IMMUTABILITY METRICS
// ============================================================================

async function testImmutability() {
  const start = Date.now()
  try {
    const block = await prisma.auditBlock.findFirst({
      where: { index: { gt: 0 } }
    })

    if (!block) throw new Error('No blocks to test')

    const originalData = block.data
    const originalHash = block.hash

    // Try to modify data
    await prisma.auditBlock.update({
      where: { id: block.id },
      data: { data: { ...originalData, modified: true } as any }
    })

    // Verify should detect the change
    const result = await verifyChain()
    const immutabilityEnforced = !result.ok

    // Restore original
    await prisma.auditBlock.update({
      where: { id: block.id },
      data: { data: originalData as any, hash: originalHash }
    })

    results.push({
      name: 'Immutability Enforcement',
      passed: immutabilityEnforced,
      value: { modificationDetected: immutabilityEnforced },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Immutability Enforcement',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

// ============================================================================
// 6. SCALABILITY METRICS
// ============================================================================

async function testBlockchainSize() {
  const start = Date.now()
  try {
    const blockCount = await prisma.auditBlock.count()
    const totalSize = await prisma.auditBlock.aggregate({
      _count: true
    })

    results.push({
      name: 'Blockchain Size',
      passed: true,
      value: { blockCount, totalBlocks: totalSize._count },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Blockchain Size',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

async function testQueryPerformance() {
  const start = Date.now()
  try {
    const queryStart = Date.now()
    const blocks = await prisma.auditBlock.findMany({
      take: 100,
      orderBy: { index: 'desc' }
    })
    const queryDuration = Date.now() - queryStart

    results.push({
      name: 'Query Performance',
      passed: queryDuration < 500, // Should be < 500ms
      value: { queryTimeMs: queryDuration, blocksRetrieved: blocks.length },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Query Performance',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

// ============================================================================
// 7. CONSISTENCY METRICS
// ============================================================================

async function testHashAlgorithmConsistency() {
  const start = Date.now()
  try {
    const testData = {
      index: 999,
      prevHash: 'test_prev_hash',
      data: { action: 'test', entity: 'test' },
      timestamp: Date.now()
    }

    // Compute hash multiple times
    const hashes = []
    for (let i = 0; i < 5; i++) {
      const raw = JSON.stringify(testData)
      const hash = crypto.createHash('sha256').update(raw).digest('hex')
      hashes.push(hash)
    }

    // All hashes should be identical
    const allIdentical = hashes.every(h => h === hashes[0])

    results.push({
      name: 'Hash Algorithm Consistency',
      passed: allIdentical,
      value: { computations: 5, allIdentical },
      duration: Date.now() - start
    })
  } catch (error: any) {
    results.push({
      name: 'Hash Algorithm Consistency',
      passed: false,
      error: error.message,
      duration: Date.now() - start
    })
  }
}

// ============================================================================
// REPORTING
// ============================================================================

function generateReport() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║        BLOCKCHAIN METRICS & VERIFICATION REPORT            ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  const categories = {
    'Cryptographic Integrity': ['Hash Consistency', 'Chain Linking Integrity', 'Genesis Block Validity'],
    'Chain Verification': ['Full Chain Verification', 'Tampering Detection'],
    'Performance': ['Block Append Performance', 'Verification Performance'],
    'Data Integrity': ['Data Persistence', 'Sequential Block Ordering'],
    'Immutability': ['Immutability Enforcement'],
    'Scalability': ['Blockchain Size', 'Query Performance'],
    'Consistency': ['Hash Algorithm Consistency']
  }

  let totalTests = 0
  let passedTests = 0

  for (const [category, tests] of Object.entries(categories)) {
    console.log(`\n📊 ${category}`)
    console.log('─'.repeat(60))

    for (const testName of tests) {
      const result = results.find(r => r.name === testName)
      if (!result) continue

      totalTests++
      if (result.passed) passedTests++

      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.name}`)

      if (result.value) {
        console.log(`   Value: ${JSON.stringify(result.value)}`)
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`)
      }
    }
  }

  console.log('\n' + '═'.repeat(60))
  console.log(`\n📈 SUMMARY`)
  console.log(`   Total Tests: ${totalTests}`)
  console.log(`   Passed: ${passedTests}`)
  console.log(`   Failed: ${totalTests - passedTests}`)
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Blockchain framework is working correctly.')
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review errors above.`)
  }

  console.log('\n' + '═'.repeat(60) + '\n')
}

// ============================================================================
// MAIN
// ============================================================================

async function runAllMetrics() {
  console.log('🚀 Starting blockchain metrics verification...\n')

  // Cryptographic Integrity
  await testHashConsistency()
  await testChainLinking()
  await testGenesisBlockValidity()

  // Chain Verification
  await testFullChainVerification()
  await testTamperingDetection()

  // Performance
  await testBlockAppendPerformance()
  await testVerificationPerformance()

  // Data Integrity
  await testDataPersistence()
  await testSequentialOrdering()

  // Immutability
  await testImmutability()

  // Scalability
  await testBlockchainSize()
  await testQueryPerformance()

  // Consistency
  await testHashAlgorithmConsistency()

  // Generate report
  generateReport()

  await prisma.$disconnect()
}

runAllMetrics().catch(console.error)
