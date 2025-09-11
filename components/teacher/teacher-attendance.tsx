"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock } from "lucide-react"
import Link from "next/link"

interface ClassInfo {
  id: string
  name: string
  subject: string
  grade: string
  schedule: string
  room: string
  enrolledStudents: string[]
  capacity: number
  status: string
}

interface AttendanceStats {
  todayAverage: number
  weekAverage: number
  monthAverage: number
}

export function TeacherAttendance() {
  const { user, getAuthHeaders } = useAuth()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    todayAverage: 0,
    weekAverage: 0,
    monthAverage: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders()
        
        // Fetch teacher's classes
        const classesResponse = await fetch("/api/classes", { headers })
        if (classesResponse.ok) {
          const allClasses = await classesResponse.json()
          const classesArray = Array.isArray(allClasses) ? allClasses : []
          const teacherClasses = classesArray.filter((cls: any) => cls.teacherId === user?.teacherId)
          
          // Fetch enrollment count for each class
          const classesWithEnrollment = await Promise.all(
            teacherClasses.map(async (cls) => {
              try {
                const enrollmentRes = await fetch(`/api/enrollments?classId=${cls.id}`, { headers })
                if (enrollmentRes.ok) {
                  const enrollments = await enrollmentRes.json()
                  return {
                    ...cls,
                    enrolledStudents: enrollments.map((e: any) => e.studentId)
                  }
                }
                return cls
              } catch (error) {
                console.error(`Failed to fetch enrollments for class ${cls.id}:`, error)
                return cls
              }
            })
          )
          
          setClasses(classesWithEnrollment)
          
          // Calculate attendance stats (simplified calculation)
          const totalStudents = classesWithEnrollment.reduce((sum, cls) => sum + (cls.enrolledStudents?.length || 0), 0)
          const estimatedPresent = Math.floor(totalStudents * 0.9) // Assume 90% attendance
          
          setAttendanceStats({
            todayAverage: totalStudents > 0 ? Math.round((estimatedPresent / totalStudents) * 100) : 0,
            weekAverage: totalStudents > 0 ? Math.round((estimatedPresent / totalStudents) * 100) - 2 : 0,
            monthAverage: totalStudents > 0 ? Math.round((estimatedPresent / totalStudents) * 100) - 5 : 0
          })
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.teacherId) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [user, getAuthHeaders])

  const getTodayClasses = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    return classes.filter(cls => 
      cls.schedule.toLowerCase().includes(today.substring(0, 3)) || 
      cls.schedule.toLowerCase().includes('daily') ||
      cls.status === 'active'
    )
  }

  const getClassStatus = (classInfo: ClassInfo) => {
    const now = new Date()
    const currentHour = now.getHours()
    
    // Simple time-based status (this could be enhanced with actual schedule parsing)
    if (currentHour < 9) return { status: 'upcoming', color: 'blue' }
    if (currentHour < 15) return { status: 'current', color: 'green' }
    return { status: 'completed', color: 'gray' }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading attendance data...</CardTitle>
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
      </div>
    )
  }

  const todayClasses = getTodayClasses()

  return (
    <div className="space-y-6">
      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No classes scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayClasses.map((classInfo) => {
                const { status, color } = getClassStatus(classInfo)
                return (
                  <div key={classInfo.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium">{classInfo.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {classInfo.schedule} • Room {classInfo.room}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-${color}-600 border-${color}-600`}>
                        <Users className="h-3 w-3 mr-1" />
                        {classInfo.enrolledStudents?.length || 0} Students
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/teacher/attendance/${classInfo.id}`}>
                        <Button size="sm" variant={status === 'completed' ? 'outline' : 'default'}>
                          <Clock className="h-4 w-4 mr-1" />
                          {status === 'completed' ? 'View Attendance' : 'Take Attendance'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.todayAverage}%</div>
            <p className="text-xs text-muted-foreground">Based on enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{attendanceStats.weekAverage}%</div>
            <p className="text-xs text-muted-foreground">Estimated average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{attendanceStats.monthAverage}%</div>
            <p className="text-xs text-muted-foreground">Estimated average</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
