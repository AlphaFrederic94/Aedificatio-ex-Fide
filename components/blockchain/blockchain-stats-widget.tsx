'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, AlertTriangle, Database, Activity } from 'lucide-react'
import Link from 'next/link'

interface BlockchainStats {
  totalBlocks: number
  chainStatus: 'verified' | 'tampered'
  lastVerification: number
  blocksByEntity: Record<string, number>
  blocksByAction: Record<string, number>
}

interface BlockchainStatsWidgetProps {
  showLink?: boolean
  compact?: boolean
}

export function BlockchainStatsWidget({ showLink = true, compact = false }: BlockchainStatsWidgetProps) {
  const [stats, setStats] = useState<BlockchainStats | null>(null)
  const [loading, setLoading] = useState(true)

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Blockchain Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const isVerified = stats.chainStatus === 'verified'
  const totalEntities = Object.keys(stats.blocksByEntity).length
  const totalActions = Object.keys(stats.blocksByAction).length

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Blockchain Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={isVerified ? "default" : "destructive"}>
              {isVerified ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Issue Detected
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Blocks</span>
            <span className="font-semibold">{stats.totalBlocks.toLocaleString()}</span>
          </div>
          {showLink && (
            <Link 
              href="/admin/blockchain" 
              className="text-sm text-primary hover:underline block text-center pt-2"
            >
              View Blockchain Dashboard →
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blockchain Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className={`p-4 rounded-lg ${isVerified ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <div className="flex items-center gap-3">
            {isVerified ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold">
                {isVerified ? 'Chain Verified ✓' : 'Integrity Issue ⚠️'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isVerified 
                  ? 'All records are cryptographically secured'
                  : 'Please contact system administrator'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="h-4 w-4" />
              <span className="text-sm">Total Blocks</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalBlocks.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Entities Tracked</span>
            </div>
            <p className="text-2xl font-bold">{totalEntities}</p>
          </div>
        </div>

        {/* Last Verification */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Verified:</span>
            <span className="font-medium">
              {new Date(stats.lastVerification).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Link to Dashboard */}
        {showLink && (
          <Link 
            href="/admin/blockchain" 
            className="block w-full text-center py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            View Blockchain Dashboard
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

