'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

interface AuditLogTableProps {
  blocks: Block[]
  total: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onFilterChange: (filters: { entity?: string; action?: string; search?: string }) => void
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

export function AuditLogTable({
  blocks,
  total,
  page,
  totalPages,
  onPageChange,
  onFilterChange
}: AuditLogTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')

  const handleSearch = () => {
    onFilterChange({
      entity: entityFilter || undefined,
      action: actionFilter || undefined,
      search: searchTerm || undefined
    })
  }

  const handleReset = () => {
    setSearchTerm('')
    setEntityFilter('')
    setActionFilter('')
    onFilterChange({})
  }

  // Extract unique entities and actions from blocks
  const entities = Array.from(new Set(blocks.map(b => b.data.entity)))
  const actions = Array.from(new Set(blocks.map(b => b.data.action)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by actor ID or entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entities.map(entity => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleSearch}>Search</Button>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Block #</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Actor ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[150px]">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.index}>
                    <TableCell className="font-mono font-medium">
                      #{block.index}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(block.data.action)}>
                        {block.data.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{block.data.entity}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {block.data.entityId ? (
                        <span title={block.data.entityId}>
                          {block.data.entityId.substring(0, 12)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span title={block.data.actorId}>
                        {block.data.actorId.substring(0, 12)}...
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(block.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span title={block.hash}>
                        {block.hash.substring(0, 12)}...
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {blocks.length} of {total} blocks
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

