'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Loader2 } from 'lucide-react'

interface Block {
  index: number
  data: {
    action: string
    actorId: string
    entity: string
    entityId?: string
  }
  timestamp: number
}

const actionColors: Record<string, string> = {
  create: 'bg-green-500/10 text-green-700',
  update: 'bg-blue-500/10 text-blue-700',
  delete: 'bg-red-500/10 text-red-700',
  submit: 'bg-purple-500/10 text-purple-700',
  grade: 'bg-orange-500/10 text-orange-700',
  upsert: 'bg-cyan-500/10 text-cyan-700',
  start: 'bg-indigo-500/10 text-indigo-700',
}

const getActionColor = (action: string): string => {
  const actionType = action.split('.')[1] || action
  return actionColors[actionType] || 'bg-gray-500/10 text-gray-700'
}

export function RecentActivityFeed({ limit = 20 }: { limit?: number }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) return

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
        const response = await fetch(`${backendUrl}/audit/recent?limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setBlocks(data)
        }
      } catch (error) {
        console.error('Failed to fetch recent activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
    // Refresh every 10 seconds
    const interval = setInterval(fetchRecentActivity, 10000)
    return () => clearInterval(interval)
  }, [limit])

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(block.data.action)}>
                        {block.data.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Block #{block.index}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium capitalize">{block.data.entity}</span>
                      {block.data.entityId && (
                        <span className="text-muted-foreground ml-1">
                          ({block.data.entityId.substring(0, 8)}...)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Actor: {block.data.actorId.substring(0, 12)}...
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {getTimeAgo(block.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

