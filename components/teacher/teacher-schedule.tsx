"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users } from "lucide-react"

interface ClassSchedule {
  id: string
  name: string
  subject: string
  grade: string
  room: string
  schedule: string
  startDate: string
  endDate: string
  enrolledCount: number
  capacity: number
  status: string
}

interface ScheduleDay {
  day: string
  classes: ClassSchedule[]
}

export function TeacherSchedule() {
  const { user, getAuthHeaders } = useAuth()
  const [classes, setClasses] = useState<ClassSchedule[]>([])
  const [todayClasses, setTodayClasses] = useState<ClassSchedule[]>([])
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduleDay[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTeacherSchedule = async () => {
      if (!user?.teacherId) return

      try {
        const headers = getAuthHeaders()
        
        // Fetch teacher's classes and enrollments
        const [classesRes, enrollmentsRes] = await Promise.all([
          fetch("/api/classes", { headers }),
          fetch("/api/enrollments", { headers })
        ])

        if (!classesRes.ok || !enrollmentsRes.ok) {
          throw new Error("Failed to fetch schedule data")
        }

        const [allClasses, allEnrollments] = await Promise.all([
          classesRes.json(),
          enrollmentsRes.json()
        ])

        // Filter classes for this teacher
        const teacherClasses = allClasses.filter((cls: any) => 
          cls.teacherId === user.teacherId && cls.status === 'active'
        )

        // Get enrollment counts
        const enrollmentCounts = allEnrollments.reduce((acc: any, enrollment: any) => {
          acc[enrollment.classId] = (acc[enrollment.classId] || 0) + 1
          return acc
        }, {})

        // Build schedule data
        const scheduleData = teacherClasses.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          subject: cls.subject,
          grade: cls.grade,
          room: cls.room,
          schedule: cls.schedule,
          startDate: cls.startDate,
          endDate: cls.endDate,
          enrolledCount: enrollmentCounts[cls.id] || 0,
          capacity: cls.capacity || 0,
          status: cls.status
        }))

        setClasses(scheduleData)

        // Filter today's classes (simplified - in real app, parse schedule properly)
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
        const todaySchedule = scheduleData.filter((cls: ClassSchedule) => 
          cls.schedule.toLowerCase().includes(today.toLowerCase())
        )
        setTodayClasses(todaySchedule)

        // Build weekly schedule
        const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        const weekly = weekDays.map(day => ({
          day,
          classes: scheduleData.filter((cls: ClassSchedule) => 
            cls.schedule.toLowerCase().includes(day.toLowerCase())
          )
        }))
        setWeeklySchedule(weekly)

      } catch (error) {
        console.error("Failed to fetch teacher schedule:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeacherSchedule()
  }, [user, getAuthHeaders])

  const parseScheduleTime = (schedule: string) => {
    // Simple time extraction - in real app, use proper schedule parsing
    const timeMatch = schedule.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
    return timeMatch ? timeMatch[1] : "Time TBD"
  }

  const getScheduleStatus = (cls: ClassSchedule) => {
    const now = new Date()
    const startDate = new Date(cls.startDate)
    const endDate = new Date(cls.endDate)
    
    if (now < startDate) return { status: "upcoming", color: "bg-blue-600" }
    if (now > endDate) return { status: "completed", color: "bg-gray-600" }
    return { status: "current", color: "bg-green-600" }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayClasses.map((cls) => {
                const { status, color } = getScheduleStatus(cls)
                return (
                  <div key={cls.id} className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
                    <div className={`flex items-center justify-center w-12 h-12 ${color} text-white rounded-lg`}>
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{cls.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {parseScheduleTime(cls.schedule)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Room {cls.room}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cls.enrolledCount} students
                        </span>
                      </div>
                    </div>
                    <Badge className={status === 'current' ? 'bg-green-600' : status === 'upcoming' ? 'bg-blue-600' : 'bg-gray-600'}>
                      {status === 'current' ? 'Current' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weeklySchedule.map((daySchedule) => (
              <div key={daySchedule.day} className="space-y-2">
                <h4 className="font-medium text-sm text-center">{daySchedule.day}</h4>
                <div className="space-y-2">
                  {daySchedule.classes.length === 0 ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No classes
                    </div>
                  ) : (
                    daySchedule.classes.map((cls) => {
                      const { color } = getScheduleStatus(cls)
                      return (
                        <div key={cls.id} className={`p-2 rounded text-xs text-white ${color.replace('bg-', 'bg-opacity-80 bg-')}`}>
                          <div className="font-medium">{cls.name}</div>
                          <div className="opacity-90">{parseScheduleTime(cls.schedule)}</div>
                          <div className="opacity-75">Room {cls.room}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Classes Summary */}
      <Card>
        <CardHeader>
          <CardTitle>All My Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No classes assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => {
                const { status, color } = getScheduleStatus(cls)
                return (
                  <div key={cls.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{cls.name}</h3>
                          <Badge variant="outline">{cls.grade}</Badge>
                          <Badge variant="secondary">{cls.subject}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {cls.schedule}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Room {cls.room}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {cls.enrolledCount}/{cls.capacity} students
                          </div>
                        </div>
                      </div>
                      <Badge className={status === 'current' ? 'bg-green-600' : status === 'upcoming' ? 'bg-blue-600' : 'bg-gray-600'}>
                        {status === 'current' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
