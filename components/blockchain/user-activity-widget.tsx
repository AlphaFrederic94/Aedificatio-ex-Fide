'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Activity } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface Block {
  index: number
  data: {
    action: string
    entity: string
  }
  timestamp: number
}

export function UserActivityWidget() {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) return

      try {
        const token = localStorage.getItem('auth-token')
        if (!token) return

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
        const response = await fetch(`${backendUrl}/audit/actor/${user.id}?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setBlocks(data)
        }
      } catch (error) {
        console.error('Failed to fetch user activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [user])

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

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Your Secured Activity
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Your Secured Activity
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          All your actions are cryptographically secured on the blockchain
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <>
            {blocks.map((block) => (
              <div
                key={block.index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(block.data.action)}>
                        {block.data.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {block.data.entity}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(block.timestamp)}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>
                  🔒 All {blocks.length} recent actions are immutably recorded and verified
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

