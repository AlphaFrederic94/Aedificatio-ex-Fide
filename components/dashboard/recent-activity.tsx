"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, BookOpen, Calendar } from "lucide-react"

interface ActivityItem {
  id: string
  type: "student" | "teacher" | "class"
  action: string
  name: string
  timestamp: string
  status?: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        fetch("/api/students", { headers }),
        fetch("/api/teachers", { headers }),
        fetch("/api/classes", { headers }),
      ])

      const students = studentsRes.ok ? await studentsRes.json() : []
      const teachers = teachersRes.ok ? await teachersRes.json() : []
      const classes = classesRes.ok ? await classesRes.json() : []

      const studentsArray = Array.isArray(students) ? students : []
      const teachersArray = Array.isArray(teachers) ? teachers : []
      const classesArray = Array.isArray(classes) ? classes : []

      const allActivities: ActivityItem[] = []

      // Recent students
      studentsArray
        .filter((s: any) => !s.deletedAt)
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
        .forEach((student: any) => {
          allActivities.push({
            id: student.id,
            type: "student",
            action: "enrolled",
            name: `${student.firstName} ${student.lastName}`,
            timestamp: student.createdAt,
            status: student.status,
          })
        })

      // Recent teachers
      teachersArray
        .filter((t: any) => !t.deletedAt)
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 2)
        .forEach((teacher: any) => {
          allActivities.push({
            id: teacher.id,
            type: "teacher",
            action: "joined",
            name: `${teacher.firstName} ${teacher.lastName}`,
            timestamp: teacher.createdAt,
            status: teacher.status,
          })
        })

      // Recent classes
      classesArray
        .filter((c: any) => !c.deletedAt)
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
        .forEach((cls: any) => {
          allActivities.push({
            id: cls.id,
            type: "class",
            action: "created",
            name: cls.name,
            timestamp: cls.createdAt,
            status: cls.status,
          })
        })

      // Sort by timestamp and take most recent
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setActivities(allActivities.slice(0, 8))
    } catch (error) {
      console.error("Failed to fetch recent activity:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "student":
        return Users
      case "teacher":
        return UserCheck
      case "class":
        return BookOpen
      default:
        return Calendar
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 hover:bg-green-100",
      inactive: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "on-leave": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      graduated: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.type)
              return (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.name} {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString()}</p>
                  </div>
                  {activity.status && (
                    <Badge className={getStatusBadge(activity.status)}>
                      {activity.status === "on-leave" ? "On Leave" : activity.status}
                    </Badge>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
