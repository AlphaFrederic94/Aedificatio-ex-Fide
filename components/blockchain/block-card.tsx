'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Hash, User, FileText, Clock, Link2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Block {
  index: number
  prevHash: string
  data: {
    action: string
    actorId: string
    entity: string
    entityId?: string
    payload?: any
  }
  timestamp: number
  hash: string
}

interface BlockCardProps {
  block: Block
}

const actionColors: Record<string, string> = {
  create: 'bg-green-500/10 text-green-700 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-700 border-red-500/20',
  submit: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  grade: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  upsert: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
  start: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
}

const getActionColor = (action: string): string => {
  const actionType = action.split('.')[1] || action
  return actionColors[actionType] || 'bg-gray-500/10 text-gray-700 border-gray-500/20'
}

export function BlockCard({ block }: BlockCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  Block #{block.index}
                </Badge>
                <Badge className={getActionColor(block.data.action)}>
                  {block.data.action}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(block.timestamp).toLocaleString()}
              </p>
            </div>
            <CollapsibleTrigger className="hover:bg-muted rounded-md p-1">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="h-3 w-3" />
                Entity
              </div>
              <p className="font-medium">{block.data.entity}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                Actor ID
              </div>
              <p className="font-mono text-xs truncate" title={block.data.actorId}>
                {block.data.actorId.substring(0, 12)}...
              </p>
            </div>
          </div>

          {/* Collapsible Details */}
          <CollapsibleContent className="space-y-3">
            <div className="pt-3 border-t space-y-3">
              {/* Hash Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  Block Hash
                </div>
                <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                  {block.hash}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Link2 className="h-3 w-3" />
                  Previous Hash
                </div>
                <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                  {block.prevHash}
                </p>
              </div>

              {/* Entity ID */}
              {block.data.entityId && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Entity ID</div>
                  <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                    {block.data.entityId}
                  </p>
                </div>
              )}

              {/* Payload */}
              {block.data.payload && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Payload Data</div>
                  <pre className="font-mono text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(block.data.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}

