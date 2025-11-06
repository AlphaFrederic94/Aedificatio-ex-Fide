'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface VerificationPanelProps {
  onVerify?: () => void
}

export function VerificationPanel({ onVerify }: VerificationPanelProps) {
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{ ok: true } | { ok: false; at: number } | null>(null)
  const [lastVerified, setLastVerified] = useState<Date | null>(null)

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/audit/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        setLastVerified(new Date())
        
        if (data.ok) {
          toast.success('✓ Blockchain integrity verified!', {
            description: 'All blocks are cryptographically valid and properly linked.'
          })
        } else {
          toast.error('⚠️ Blockchain integrity issue detected!', {
            description: `Tampering detected at block #${data.at}`
          })
        }

        if (onVerify) onVerify()
      } else {
        toast.error('Failed to verify blockchain')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Failed to verify blockchain')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Chain Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verification Status */}
        {result && (
          <div className={`p-4 rounded-lg ${result.ok ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <div className="flex items-center gap-3">
              {result.ok ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-500" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold">
                  {result.ok ? 'Chain Verified ✓' : 'Integrity Issue Detected ⚠️'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {result.ok 
                    ? 'All blocks are cryptographically valid and properly linked.'
                    : `Tampering detected at block #${result.at}. Please contact system administrator.`
                  }
                </p>
              </div>
              <Badge variant={result.ok ? "default" : "destructive"}>
                {result.ok ? 'VERIFIED' : 'TAMPERED'}
              </Badge>
            </div>
          </div>
        )}

        {/* Last Verified */}
        {lastVerified && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Verified:</span>
            <span className="font-medium">{lastVerified.toLocaleString()}</span>
          </div>
        )}

        {/* Verify Button */}
        <Button 
          onClick={handleVerify} 
          disabled={verifying}
          className="w-full"
          size="lg"
        >
          {verifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying Chain...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Verify Chain Integrity
            </>
          )}
        </Button>

        {/* Info */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">How Verification Works</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Validates each block's cryptographic hash</li>
            <li>Verifies sequential linking between blocks</li>
            <li>Detects any tampering or data modification</li>
            <li>Ensures chain integrity from genesis to latest block</li>
          </ul>
        </div>

        {/* Security Note */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            🔒 <strong>Security:</strong> This verification process uses SHA-256 cryptographic hashing 
            to ensure that no data has been altered since it was recorded on the blockchain.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

