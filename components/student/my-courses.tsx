"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, User, Calendar } from "lucide-react"
import Link from "next/link"

interface CourseInfo {
  id: string
  name: string
  subject: string
  teacherName: string
  schedule: string
  room: string
  progress: number
  grade: string
  nextClass: string
}

export function MyCourses() {
  const { user, getAuthHeaders } = useAuth()
  const [courses, setCourses] = useState<CourseInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const headers = getAuthHeaders()
        // Pull enrollments for this student, then fetch classes and teachers to compute view model
        const [enrollRes, classesRes, teachersRes] = await Promise.all([
          fetch(`/api/enrollments/student/${user?.studentId}`, { headers }),
          fetch("/api/classes", { headers }),
          fetch("/api/teachers", { headers }),
        ])

        if (!enrollRes.ok || !classesRes.ok || !teachersRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const [enrollments, allClasses, allTeachers] = await Promise.all([
          enrollRes.json(),
          classesRes.json(),
          teachersRes.json(),
        ])

        const classIds = new Set(enrollments.map((e: any) => e.classId))
        const studentClasses = allClasses.filter((cls: any) => classIds.has(cls.id))

        // Build teacher name; no mock progress/grades
        const enhancedCourses = studentClasses.map((cls: any) => {
          const teacher = allTeachers.find((t: any) => t.id === cls.teacherId)
          return {
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : (cls.teacherName || "Unknown"),
            schedule: cls.schedule,
            room: cls.room,
            progress: 0,
            grade: cls.grade,
            nextClass: `${new Date(cls.startDate).toLocaleDateString()}`,
          }
        })

        setCourses(enhancedCourses)
      } catch (error) {
        console.error("Failed to fetch courses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.studentId) {
      fetchMyCourses()
    }
  }, [user, getAuthHeaders])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded"></div>
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
          <BookOpen className="h-5 w-5" />
          My Courses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No courses enrolled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{course.name}</h3>
                      <Badge variant="outline">{course.grade}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {course.teacherName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.schedule}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Room {course.room}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Course Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/student/classes/${course.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/student/assignments?class=${course.id}`}>
                      <Button size="sm">Assignments</Button>
                    </Link>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Next class: {course.nextClass}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
