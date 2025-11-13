/**
 * Test Auto-Repair Functionality
 */

import { detectTamperedBlocks, autoRepairAll, verifyRepair, getRepairStatus } from './src/modules/audit/auto-repair.ts'

async function testAutoRepair() {
  console.log('🔧 Testing Auto-Repair Functionality\n')

  // Step 1: Detect tampering
  console.log('Step 1: Detecting tampered blocks...')
  const tampered = await detectTamperedBlocks()
  console.log(`Found ${tampered.length} tampered block(s): ${tampered.join(', ')}\n`)

  if (tampered.length === 0) {
    console.log('✅ No tampered blocks found!')
    return
  }

  // Step 2: Get repair status
  console.log('Step 2: Getting repair status...')
  const status = await getRepairStatus()
  console.log(`Status: ${status.repairSummary}\n`)

  // Step 3: Auto-repair
  console.log('Step 3: Running auto-repair...')
  const results = await autoRepairAll()

  console.log(`\n✅ Repair Results:`)
  results.forEach(r => {
    if (r.status === 'repaired') {
      console.log(`   Block #${r.blockIndex}: ✅ Repaired`)
      console.log(`      Old hash: ${r.oldHash?.substring(0, 16)}...`)
      console.log(`      New hash: ${r.newHash?.substring(0, 16)}...`)
    } else {
      console.log(`   Block #${r.blockIndex}: ❌ Failed - ${r.error}`)
    }
  })

  // Step 4: Verify repair
  console.log('\nStep 4: Verifying repair...')
  const verified = await verifyRepair()

  if (verified) {
    console.log('✅ Blockchain successfully repaired and verified!')
  } else {
    console.log('❌ Repair verification failed')
  }

  console.log('\n' + '═'.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   Blocks Repaired: ${results.filter(r => r.status === 'repaired').length}`)
  console.log(`   Repair Verified: ${verified ? 'Yes' : 'No'}`)
  console.log(`   Status: ${verified ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log('\n' + '═'.repeat(60) + '\n')
}

testAutoRepair().catch(console.error)
