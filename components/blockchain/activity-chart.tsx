'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, PieChart } from 'lucide-react'

interface ActivityChartProps {
  blocksByEntity: Record<string, number>
  blocksByAction: Record<string, number>
}

export function ActivityChart({ blocksByEntity, blocksByAction }: ActivityChartProps) {
  // Calculate percentages for entity distribution
  const totalEntityBlocks = Object.values(blocksByEntity).reduce((a, b) => a + b, 0)
  const entityData = Object.entries(blocksByEntity)
    .map(([entity, count]) => ({
      entity,
      count,
      percentage: ((count / totalEntityBlocks) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate percentages for action distribution
  const totalActionBlocks = Object.values(blocksByAction).reduce((a, b) => a + b, 0)
  const actionData = Object.entries(blocksByAction)
    .map(([action, count]) => ({
      action,
      count,
      percentage: ((count / totalActionBlocks) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)

  const entityColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
  ]

  const actionColors = [
    'bg-emerald-500',
    'bg-sky-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-violet-500',
    'bg-teal-500',
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Activity by Entity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-4 w-4" />
            Activity by Entity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entityData.map((item, index) => (
            <div key={item.entity} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{item.entity}</span>
                <span className="text-muted-foreground">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${entityColors[index % entityColors.length]} transition-all`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
          {entityData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity by Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart className="h-4 w-4" />
            Activity by Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionData.map((item, index) => (
            <div key={item.action} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.action}</span>
                <span className="text-muted-foreground">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${actionColors[index % actionColors.length]} transition-all`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
          {actionData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

