/**
 * Blockchain Monitoring Service
 * 
 * Continuously monitors blockchain integrity and alerts on tampering
 * Prevents future integrity issues by detecting changes in real-time
 */

import { prisma } from '../../infrastructure/prisma/client'
import { verifyChain } from './blockchain'

interface MonitoringConfig {
  checkIntervalMs: number // How often to check (default: 1 hour)
  alertOnTampering: boolean // Send alerts when tampering detected
  autoRepair: boolean // Automatically attempt to repair (not recommended)
  logToFile: boolean // Log monitoring results
}

const defaultConfig: MonitoringConfig = {
  checkIntervalMs: 60 * 60 * 1000, // 1 hour
  alertOnTampering: true,
  autoRepair: false,
  logToFile: true
}

let monitoringActive = false
let lastVerificationResult: { ok: true } | { ok: false; at: number } | null = null
let lastVerificationTime: Date | null = null

/**
 * Start blockchain monitoring
 */
export function startBlockchainMonitoring(config: Partial<MonitoringConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  if (monitoringActive) {
    console.warn('⚠️  Blockchain monitoring is already active')
    return
  }

  monitoringActive = true
  console.log('🔐 Starting blockchain monitoring service...')
  console.log(`   Check interval: ${finalConfig.checkIntervalMs / 1000 / 60} minutes`)
  console.log(`   Alert on tampering: ${finalConfig.alertOnTampering}`)

  // Run initial check
  performCheck(finalConfig)

  // Schedule periodic checks
  setInterval(() => performCheck(finalConfig), finalConfig.checkIntervalMs)
}

/**
 * Stop blockchain monitoring
 */
export function stopBlockchainMonitoring() {
  monitoringActive = false
  console.log('🛑 Blockchain monitoring stopped')
}

/**
 * Perform a verification check
 */
async function performCheck(config: MonitoringConfig) {
  try {
    const result = await verifyChain()
    lastVerificationResult = result
    lastVerificationTime = new Date()

    if (result.ok) {
      console.log(`✅ [${new Date().toISOString()}] Blockchain verified - All blocks intact`)
    } else {
      console.error(`❌ [${new Date().toISOString()}] TAMPERING DETECTED at block #${result.at}`)

      if (config.alertOnTampering) {
        await sendTamperingAlert(result.at)
      }

      if (config.autoRepair) {
        console.warn('⚠️  Auto-repair is enabled but not recommended. Manual intervention required.')
      }
    }

    if (config.logToFile) {
      await logVerificationResult(result)
    }
  } catch (error) {
    console.error('❌ Monitoring check failed:', error)
  }
}

/**
 * Send tampering alert (implement based on your notification system)
 */
async function sendTamperingAlert(blockIndex: number) {
  console.error(`
╔════════════════════════════════════════════════════════════╗
║                  🚨 SECURITY ALERT 🚨                     ║
║                                                            ║
║  Blockchain Tampering Detected!                           ║
║  Block #${blockIndex} has been modified or corrupted                  ║
║                                                            ║
║  Action Required:                                          ║
║  1. Review audit logs immediately                          ║
║  2. Check database access logs                             ║
║  3. Contact system administrator                           ║
║  4. Consider restoring from backup                         ║
║                                                            ║
���  Time: ${new Date().toISOString()}                    ║
╚════════════════════════════════════════════════════════════╝
  `)

  // TODO: Implement your notification system
  // Examples:
  // - Send email to admin
  // - Send Slack message
  // - Create incident in monitoring system
  // - Log to external security service
}

/**
 * Log verification result to file
 */
async function logVerificationResult(result: { ok: true } | { ok: false; at: number }) {
  try {
    // TODO: Implement file logging
    // Example:
    // const fs = require('fs').promises
    // const logEntry = {
    //   timestamp: new Date().toISOString(),
    //   result: result.ok ? 'VERIFIED' : `TAMPERED_AT_BLOCK_${result.at}`,
    //   blockCount: await prisma.auditBlock.count()
    // }
    // await fs.appendFile('blockchain-verification.log', JSON.stringify(logEntry) + '\n')
  } catch (error) {
    console.error('Failed to log verification result:', error)
  }
}

/**
 * Get current monitoring status
 */
export function getMonitoringStatus() {
  return {
    active: monitoringActive,
    lastVerificationTime,
    lastVerificationResult,
    status: lastVerificationResult?.ok ? 'HEALTHY' : 'COMPROMISED'
  }
}

/**
 * Manually trigger a verification check
 */
export async function triggerManualCheck() {
  console.log('🔍 Triggering manual blockchain verification...')
  const result = await verifyChain()

  if (result.ok) {
    console.log('✅ Blockchain verified successfully')
  } else {
    console.error(`❌ Tampering detected at block #${result.at}`)
  }

  return result
}

/**
 * Get blockchain health metrics
 */
export async function getBlockchainHealth() {
  const totalBlocks = await prisma.auditBlock.count()
  const result = await verifyChain()

  return {
    totalBlocks,
    isHealthy: result.ok,
    status: result.ok ? 'VERIFIED' : `TAMPERED_AT_BLOCK_${result.at}`,
    lastCheck: lastVerificationTime,
    monitoringActive
  }
}

/**
 * Detect suspicious patterns
 */
export async function detectSuspiciousPatterns() {
  const blocks = await prisma.auditBlock.findMany({
    orderBy: { index: 'desc' },
    take: 100 // Check last 100 blocks
  })

  const patterns = {
    recentModifications: 0,
    duplicateTimestamps: 0,
    unusualActions: 0,
    suspiciousActors: new Set<string>()
  }

  // Check for blocks modified recently (within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  blocks.forEach(block => {
    if (block.timestamp > oneHourAgo) {
      patterns.recentModifications++
    }
  })

  // Check for duplicate timestamps (suspicious)
  const timestamps = blocks.map(b => b.timestamp.getTime())
  const duplicates = timestamps.filter((t, i) => timestamps.indexOf(t) !== i)
  patterns.duplicateTimestamps = duplicates.length

  // Check for unusual actions
  const unusualActions = ['exam.delete', 'student.delete', 'teacher.delete', 'class.delete']
  blocks.forEach(block => {
    const data = block.data as any
    if (unusualActions.includes(data.action)) {
      patterns.unusualActions++
      patterns.suspiciousActors.add(data.actorId)
    }
  })

  return {
    ...patterns,
    suspiciousActors: Array.from(patterns.suspiciousActors),
    riskLevel: patterns.recentModifications > 5 ? 'HIGH' : 'NORMAL'
  }
}

/**
 * Export monitoring data for analysis
 */
export async function exportMonitoringData() {
  const blocks = await prisma.auditBlock.findMany({
    orderBy: { index: 'asc' }
  })

  const health = await getBlockchainHealth()
  const patterns = await detectSuspiciousPatterns()

  return {
    exportTime: new Date().toISOString(),
    health,
    patterns,
    blockCount: blocks.length,
    blocks: blocks.map(b => ({
      index: b.index,
      action: (b.data as any).action,
      entity: (b.data as any).entity,
      timestamp: b.timestamp,
      hash: b.hash.substring(0, 16) + '...'
    }))
  }
}
