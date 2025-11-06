'use client'

import { useEffect, useState } from 'react'
import { Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'

interface BlockchainStats {
  totalBlocks: number
  chainStatus: 'verified' | 'tampered'
  lastVerification: number
}

export function BlockchainBadge() {
  const [stats, setStats] = useState<BlockchainStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) return

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
        const response = await fetch(`${backendUrl}/audit/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch blockchain stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1.5 cursor-pointer">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Loading...</span>
      </Badge>
    )
  }

  if (!stats) return null

  const isVerified = stats.chainStatus === 'verified'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge 
          variant={isVerified ? "default" : "destructive"} 
          className="gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Shield className="h-3 w-3" />
          <span className="text-xs font-medium">Blockchain Secured</span>
          {isVerified ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Blockchain Security</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Chain Status:</span>
                <Badge variant={isVerified ? "default" : "destructive"} className="gap-1">
                  {isVerified ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Tampered
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Blocks:</span>
                <span className="font-medium">{stats.totalBlocks.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last Verified:</span>
                <span className="font-medium text-xs">
                  {new Date(stats.lastVerification).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                All system operations are cryptographically secured and immutably recorded on our private blockchain.
              </p>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

