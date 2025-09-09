"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"

interface GradeData {
  subject: string
  currentGrade: number
  trend: "up" | "down" | "stable"
  assignments: number
  completed: number
  classId: string
}

export function GradeOverview() {
  const { user, getAuthHeaders } = useAuth()
  const [grades, setGrades] = useState<GradeData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const headers = getAuthHeaders()

        // Fetch student's enrollments
        const enrollRes = await fetch(`/api/enrollments?studentId=${user?.studentId}`, { headers })
        if (!enrollRes.ok) return

        const enrollments = await enrollRes.json()

        // Fetch classes
        const classesRes = await fetch('/api/classes', { headers })
        if (!classesRes.ok) return

        const allClasses = await classesRes.json()
        const classesArray = Array.isArray(allClasses) ? allClasses : []

        // Get student's classes
        const classIds = new Set(enrollments.map((e: any) => e.classId))
        const studentClasses = classesArray.filter((cls: any) => classIds.has(cls.id))

        // Fetch assignments for grade calculation
        const assignmentsRes = await fetch('/api/assignments', { headers })
        const assignments = assignmentsRes.ok ? await assignmentsRes.json() : []

        const gradeData: GradeData[] = studentClasses.map((cls: any) => {
          const classAssignments = assignments.filter((a: any) => a.classId === cls.id)
          const studentSubmissions = classAssignments
            .map((a: any) => a.submissions?.find((s: any) => s.studentId === user?.studentId))
            .filter(Boolean)

          const completedCount = studentSubmissions.length
          const gradedSubmissions = studentSubmissions.filter((s: any) => s.grade !== null && s.grade !== undefined)

          let currentGrade = 0
          if (gradedSubmissions.length > 0) {
            const totalPoints = gradedSubmissions.reduce((sum: number, submission: any) => {
              const assignment = classAssignments.find((a: any) =>
                a.submissions?.some((s: any) => s.id === submission.id)
              )
              return sum + (submission.grade / assignment.maxPoints) * 100
            }, 0)
            currentGrade = Math.round(totalPoints / gradedSubmissions.length)
          }

          return {
            subject: `${cls.subject} ${cls.grade}`,
            currentGrade,
            trend: currentGrade >= 85 ? "up" : currentGrade >= 75 ? "stable" : "down",
            assignments: classAssignments.length,
            completed: completedCount,
            classId: cls.id
          }
        })

        setGrades(gradeData)
      } catch (error) {
        console.error('Failed to fetch grades:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.studentId) {
      fetchGrades()
    } else {
      setIsLoading(false)
    }
  }, [user, getAuthHeaders])

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getGradeBg = (grade: number) => {
    if (grade >= 90) return "bg-green-50"
    if (grade >= 80) return "bg-blue-50"
    if (grade >= 70) return "bg-yellow-50"
    return "bg-red-50"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Grade Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
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
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Grade Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {grades.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No grades available yet</p>
            </div>
          ) : (
            grades.map((grade, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium">{grade.subject}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-2xl font-bold ${getGradeColor(grade.currentGrade)}`}>
                      {grade.currentGrade}%
                    </span>
                    {grade.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getGradeBg(grade.currentGrade)}`}>
                  <div className={`text-lg font-bold ${getGradeColor(grade.currentGrade)}`}>
                    {grade.currentGrade >= 90
                      ? "A"
                      : grade.currentGrade >= 80
                        ? "B"
                        : grade.currentGrade >= 70
                          ? "C"
                          : "D"}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Assignments Completed</span>
                  <span>
                    {grade.completed}/{grade.assignments}
                  </span>
                </div>
                <Progress value={(grade.completed / grade.assignments) * 100} className="h-2" />
              </div>
            </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
