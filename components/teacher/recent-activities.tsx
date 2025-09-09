"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle, Users, FileText, MessageSquare } from "lucide-react"

interface Activity {
  id: string
  type: string
  title: string
  description: string
  time: string
  status: string
  icon: any
}

export function RecentActivities() {
  const { user, getAuthHeaders } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
  }

  const parseRelativeTime = (timeString: string) => {
    if (timeString === 'Just now') return 0
    if (timeString.includes('hour')) {
      const hours = parseInt(timeString.split(' ')[0])
      return hours
    }
    if (timeString.includes('day')) {
      const days = parseInt(timeString.split(' ')[0])
      return days * 24
    }
    return 999 // For dates, put them last
  }

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const headers = getAuthHeaders()
        const allActivities: Activity[] = []

        // Fetch recent assignments
        try {
          const assignmentsRes = await fetch('/api/assignments', { headers })
          if (assignmentsRes.ok) {
            const assignments = await assignmentsRes.json()
            const recentAssignments = assignments
              .filter((a: any) => a.teacherId === user?.teacherId)
              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 2)

            recentAssignments.forEach((assignment: any) => {
              allActivities.push({
                id: assignment.id,
                type: 'assignment',
                title: `Assignment: ${assignment.title}`,
                description: `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
                time: getRelativeTime(assignment.updatedAt),
                status: 'completed',
                icon: FileText
              })
            })
          }
        } catch (error) {
          console.error('Failed to fetch assignments:', error)
        }

        // Fetch recent messages
        try {
          const messagesRes = await fetch('/api/messages', { headers })
          if (messagesRes.ok) {
            const messages = await messagesRes.json()
            const recentMessages = messages
              .filter((m: any) => m.recipientId === user?.id || m.senderId === user?.id)
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2)

            recentMessages.forEach((message: any) => {
              allActivities.push({
                id: message.id,
                type: 'message',
                title: message.senderId === user?.id ? `Sent: ${message.subject}` : `Received: ${message.subject}`,
                description: `${message.senderId === user?.id ? 'To' : 'From'}: ${message.senderId === user?.id ? message.recipient?.firstName : message.sender?.firstName} ${message.senderId === user?.id ? message.recipient?.lastName : message.sender?.lastName}`,
                time: getRelativeTime(message.createdAt),
                status: message.read ? 'completed' : 'pending',
                icon: MessageSquare
              })
            })
          }
        } catch (error) {
          console.error('Failed to fetch messages:', error)
        }

        // Sort all activities by time and take the most recent 5
        allActivities.sort((a, b) => {
          const timeA = parseRelativeTime(a.time)
          const timeB = parseRelativeTime(b.time)
          return timeA - timeB
        })

        setActivities(allActivities.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch recent activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.teacherId) {
      fetchRecentActivities()
    } else {
      setIsLoading(false)
    }
  }, [user, getAuthHeaders])

  // Fallback activities if no real data
  const fallbackActivities: Activity[] = [
    {
      id: "1",
      type: "welcome",
      title: "Welcome to your teacher dashboard!",
      description: "Start by creating assignments and taking attendance",
      time: "Just now",
      status: "pending",
      icon: CheckCircle,
    }
  ]

  const displayActivities = activities.length > 0 ? activities : fallbackActivities

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700"
      case "pending":
        return "bg-yellow-50 text-yellow-700"
      case "upcoming":
        return "bg-blue-50 text-blue-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  const getIconColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "upcoming":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-lg bg-gray-50`}>
                  <activity.icon className={`h-4 w-4 ${getIconColor(activity.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <Badge variant="secondary" className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}