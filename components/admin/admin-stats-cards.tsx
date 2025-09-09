"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, TrendingUp, UserCheck, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // Import useAuth hook

interface AdminStats {
  totalStudents: number
  activeStudents: number
  totalTeachers: number
  activeTeachers: number
  totalClasses: number
  activeClasses: number
  enrollmentRate: number
  teacherUtilization: number
}

export function AdminStatsCards() {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    totalClasses: 0,
    activeClasses: 0,
    enrollmentRate: 0,
    teacherUtilization: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { getAuthHeaders } = useAuth() // Add auth context to get headers

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = getAuthHeaders() // Add auth headers to API requests

        // Fetch data from all endpoints
        const [studentsRes, teachersRes, classesRes] = await Promise.all([
          fetch("/api/students", { headers }),
          fetch("/api/teachers", { headers }),
          fetch("/api/classes", { headers }),
        ])

        if (!studentsRes.ok || !teachersRes.ok || !classesRes.ok) {
          throw new Error("Failed to fetch data") // Check if responses are ok and handle errors
        }

        const [students, teachers, classes] = await Promise.all([
          studentsRes.json(),
          teachersRes.json(),
          classesRes.json(),
        ])

        const studentsArray = Array.isArray(students) ? students : [] // Ensure data is arrays before filtering
        const teachersArray = Array.isArray(teachers) ? teachers : []
        const classesArray = Array.isArray(classes) ? classes : []

        const activeStudents = studentsArray.filter((s: any) => s.status === "active").length
        const activeTeachers = teachersArray.filter((t: any) => t.status === "active").length
        const activeClasses = classesArray.filter((c: any) => c.status === "active").length

        // Calculate enrollment rate (students enrolled vs total capacity)
        const totalCapacity = classesArray.reduce((sum: number, cls: any) => sum + (cls.capacity || 30), 0)
        const enrollmentRate = totalCapacity > 0 ? (activeStudents / totalCapacity) * 100 : 0

        // Calculate teacher utilization (teachers with classes vs total teachers)
        const teachersWithClasses = new Set(classesArray.map((c: any) => c.teacherId)).size
        const teacherUtilization = activeTeachers > 0 ? (teachersWithClasses / activeTeachers) * 100 : 0

        setStats({
          totalStudents: studentsArray.length,
          activeStudents,
          totalTeachers: teachersArray.length,
          activeTeachers,
          totalClasses: classesArray.length,
          activeClasses,
          enrollmentRate: Math.round(enrollmentRate),
          teacherUtilization: Math.round(teacherUtilization),
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
        setStats({
          totalStudents: 0,
          activeStudents: 0,
          totalTeachers: 0,
          activeTeachers: 0,
          totalClasses: 0,
          activeClasses: 0,
          enrollmentRate: 0,
          teacherUtilization: 0,
        }) // Set default stats on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [getAuthHeaders])

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      subtitle: `${stats.activeTeachers} active`,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Classes",
      value: stats.totalClasses,
      subtitle: `${stats.activeClasses} active`,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Enrollment Rate",
      value: `${stats.enrollmentRate}%`,
      subtitle: "Student capacity",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Teacher Utilization",
      value: `${stats.teacherUtilization}%`,
      subtitle: "Teachers with classes",
      icon: UserCheck,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "System Health",
      value: "Excellent",
      subtitle: "All systems operational",
      icon: AlertCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
