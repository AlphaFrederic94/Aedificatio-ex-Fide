'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Wrench, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface TamperingRepairPanelProps {
  onRepairComplete?: () => void
}

export function TamperingRepairPanel({ onRepairComplete }: TamperingRepairPanelProps) {
  const [tamperedBlocks, setTamperedBlocks] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [repairStatus, setRepairStatus] = useState<any>(null)

  useEffect(() => {
    checkTampering()
  }, [])

  const checkTampering = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/audit/detect-tampering`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTamperedBlocks(data.tamperedBlocks)
      } else {
        toast.error('Failed to check tampering')
      }
    } catch (error) {
      console.error('Error checking tampering:', error)
      toast.error('Failed to check tampering')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoRepair = async () => {
    setRepairing(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/audit/auto-repair`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setRepairStatus(data)

        if (data.verified) {
          toast.success('✅ Blockchain successfully repaired!', {
            description: `${data.repaired} block(s) repaired and verified`
          })
          setTamperedBlocks([])
          if (onRepairComplete) onRepairComplete()
        } else {
          toast.error('⚠️ Repair completed but verification failed')
        }
      } else {
        toast.error('Failed to repair blockchain')
      }
    } catch (error) {
      console.error('Error repairing blockchain:', error)
      toast.error('Failed to repair blockchain')
    } finally {
      setRepairing(false)
    }
  }

  const handleRepairSingleBlock = async (blockIndex: number) => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/audit/repair-block/${blockIndex}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Block #${blockIndex} repaired successfully`)
        checkTampering()
      } else {
        toast.error(`Failed to repair block #${blockIndex}`)
      }
    } catch (error) {
      console.error('Error repairing block:', error)
      toast.error('Failed to repair block')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Checking blockchain integrity...</span>
        </CardContent>
      </Card>
    )
  }

  if (tamperedBlocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Blockchain Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <h4 className="font-semibold text-green-900">Blockchain Healthy</h4>
              <p className="text-sm text-green-700">No tampered blocks detected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Blockchain Tampering Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tampering Alert */}
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
          <h4 className="font-semibold text-red-900 mb-2">⚠️ Integrity Issue</h4>
          <p className="text-sm text-red-800 mb-3">
            {tamperedBlocks.length} block(s) have been tampered with or corrupted:
          </p>
          <div className="flex flex-wrap gap-2">
            {tamperedBlocks.map(blockIndex => (
              <Badge key={blockIndex} variant="destructive">
                Block #{blockIndex}
              </Badge>
            ))}
          </div>
        </div>

        {/* Repair Options */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Repair Options:</h4>

          {/* Auto-Repair All */}
          <Button
            onClick={handleAutoRepair}
            disabled={repairing}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {repairing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Repairing...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Auto-Repair All Blocks
              </>
            )}
          </Button>

          {/* Individual Block Repair */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Or repair individual blocks:</p>
            <div className="grid grid-cols-2 gap-2">
              {tamperedBlocks.map(blockIndex => (
                <Button
                  key={blockIndex}
                  onClick={() => handleRepairSingleBlock(blockIndex)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Repair Block #{blockIndex}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Repair Status */}
        {repairStatus && (
          <div className={`p-4 rounded-lg ${repairStatus.verified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <h4 className={`font-semibold mb-2 ${repairStatus.verified ? 'text-green-900' : 'text-yellow-900'}`}>
              {repairStatus.verified ? '✅ Repair Successful' : '⚠️ Repair Status'}
            </h4>
            <p className={`text-sm ${repairStatus.verified ? 'text-green-700' : 'text-yellow-700'}`}>
              {repairStatus.repaired} block(s) repaired
              {repairStatus.verified && ' and verified'}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>ℹ️ Info:</strong> Auto-repair will recalculate correct hashes and rebuild the chain from the first tampered block. This is safe and non-destructive.
          </p>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={checkTampering}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
