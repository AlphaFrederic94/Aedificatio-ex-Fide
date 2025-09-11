"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Edit, BookOpen, TrendingUp, Clock } from "lucide-react"

interface StudentData {
  id: string
  firstName: string
  lastName: string
  email: string
  grade: string
  dateOfBirth: string
  enrollmentDate: string
  status: string
  parentName: string
  parentEmail: string
  parentPhone: string
  address: string
}

interface StudentStats {
  enrolledCourses: number
  attendanceRate: number
  assignmentsDue: number
  upcomingExams: number
}

export function StudentProfile() {
  const { user, getAuthHeaders } = useAuth()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [stats, setStats] = useState<StudentStats>({
    enrolledCourses: 0,
    attendanceRate: 0,
    assignmentsDue: 0,
    upcomingExams: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user?.studentId) return

      try {
        const headers = getAuthHeaders()
        
        // Fetch student data
        const studentRes = await fetch(`/api/students/${user.studentId}`, { headers })
        if (studentRes.ok) {
          const student = await studentRes.json()
          setStudentData(student)
        }

        // Fetch student stats
        const [enrollmentsRes, attendanceRes, assignmentsRes] = await Promise.all([
          fetch(`/api/enrollments/student/${user.studentId}`, { headers }),
          fetch(`/api/attendance/student/${user.studentId}`, { headers }),
          fetch(`/api/assignments?studentId=${user.studentId}`, { headers })
        ])

        let enrolledCourses = 0
        let attendanceRate = 0
        let assignmentsDue = 0

        if (enrollmentsRes.ok) {
          const enrollments = await enrollmentsRes.json()
          enrolledCourses = enrollments.length
        }

        if (attendanceRes.ok) {
          const attendance = await attendanceRes.json()
          const totalRecords = attendance.length
          const presentRecords = attendance.filter((a: any) => a.status === 'present').length
          attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
        }

        if (assignmentsRes.ok) {
          const assignments = await assignmentsRes.json()
          const now = new Date()
          assignmentsDue = assignments.filter((a: any) => 
            new Date(a.dueDate) > now && !a.submissions?.some((s: any) => s.studentId === user.studentId)
          ).length
        }

        setStats({
          enrolledCourses,
          attendanceRate,
          assignmentsDue,
          upcomingExams: 0 // TODO: Implement exams system
        })

      } catch (error) {
        console.error("Failed to fetch student profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudentProfile()
  }, [user, getAuthHeaders])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load profile data</p>
        </CardContent>
      </Card>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Info */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {getInitials(studentData.firstName, studentData.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{studentData.firstName} {studentData.lastName}</h3>
                <p className="text-muted-foreground">Student ID: {studentData.id}</p>
                <Badge className="mt-1">{studentData.grade}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{studentData.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(studentData.dateOfBirth)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{studentData.address}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={studentData.status === 'active' ? 'default' : 'secondary'}>
                  {studentData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Current Grade</label>
                <div className="text-lg font-semibold">{studentData.grade}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Enrollment Date</label>
                <div className="text-lg font-semibold">{formatDate(studentData.enrollmentDate)}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Enrolled Courses</label>
                <div className="text-lg font-semibold text-blue-600">{stats.enrolledCourses}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Attendance Rate</label>
                <div className="text-lg font-semibold text-green-600">{stats.attendanceRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Parent/Guardian</label>
                <div className="text-lg font-semibold">{studentData.parentName}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{studentData.parentPhone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{studentData.parentEmail}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.enrolledCourses}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <BookOpen className="h-3 w-3" />
                Enrolled Courses
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Attendance Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.assignmentsDue}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Assignments Due
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.upcomingExams}</div>
              <div className="text-sm text-muted-foreground">Upcoming Exams</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
