"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BarChart3, Calendar, Trophy } from "lucide-react"

interface StudentStats {
  enrolledClasses: number
  averageGrade: number
  attendanceRate: number
  completedAssignments: number
}

export function StudentStats() {
  const { user, getAuthHeaders } = useAuth()
  const [stats, setStats] = useState<StudentStats>({
    enrolledClasses: 0,
    averageGrade: 0,
    attendanceRate: 0,
    completedAssignments: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStudentStats = async () => {
      try {
        const headers = getAuthHeaders()

        // Fetch enrollments and classes to compute student's courses
        const [enrollRes, classesRes] = await Promise.all([
          fetch(`/api/enrollments/student/${user?.studentId}`, { headers }),
          fetch("/api/classes", { headers }),
        ])
        if (!classesRes.ok || !enrollRes.ok) {
          throw new Error("Failed to fetch data")
        }
        const [enrollments, allClasses] = await Promise.all([enrollRes.json(), classesRes.json()])
        const classesArray = Array.isArray(allClasses) ? allClasses : []
        const classIds = new Set(enrollments.map((e: any) => e.classId))
        const studentClasses = classesArray.filter((cls: any) => classIds.has(cls.id))

        // Fetch real assignment data for grades
        let totalGrades = 0
        let gradeCount = 0
        let completedAssignments = 0

        try {
          const assignmentsRes = await fetch('/api/assignments', { headers })
          if (assignmentsRes.ok) {
            const assignments = await assignmentsRes.json()
            assignments.forEach((assignment: any) => {
              if (assignment.submissions) {
                const studentSubmission = assignment.submissions.find((s: any) => s.studentId === user?.studentId)
                if (studentSubmission) {
                  completedAssignments++
                  if (studentSubmission.grade !== null && studentSubmission.grade !== undefined) {
                    totalGrades += (studentSubmission.grade / assignment.maxPoints) * 100
                    gradeCount++
                  }
                }
              }
            })
          }
        } catch (error) {
          console.error('Failed to fetch assignments:', error)
        }

        // Fetch real attendance data
        let attendanceRate = 95 // Default fallback
        try {
          const attendanceRes = await fetch('/api/attendance', { headers })
          if (attendanceRes.ok) {
            const attendanceRecords = await attendanceRes.json()
            const studentAttendance = attendanceRecords.filter((a: any) => a.studentId === user?.studentId)
            if (studentAttendance.length > 0) {
              const presentCount = studentAttendance.filter((a: any) => a.present).length
              attendanceRate = Math.round((presentCount / studentAttendance.length) * 100)
            }
          }
        } catch (error) {
          console.error('Failed to fetch attendance:', error)
        }

        const averageGrade = gradeCount > 0 ? Math.round(totalGrades / gradeCount) : 0

        setStats({
          enrolledClasses: studentClasses.length,
          averageGrade,
          attendanceRate,
          completedAssignments,
        })
      } catch (error) {
        console.error("Failed to fetch student stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.studentId) {
      fetchStudentStats()
    }
  }, [user, getAuthHeaders])

  const statCards = [
    {
      title: "Enrolled Classes",
      value: stats.enrolledClasses,
      subtitle: "Active courses",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Average Grade",
      value: `${stats.averageGrade}%`,
      subtitle: "Overall GPA",
      icon: BarChart3,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Attendance",
      value: `${stats.attendanceRate}%`,
      subtitle: "This semester",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Assignments",
      value: stats.completedAssignments,
      subtitle: "Completed",
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
