"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TeacherLayout } from "@/components/layout/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { 
  Users, 
  Calendar, 
  Clock, 
  Save,
  UserCheck,
  UserX,
  Search
} from "lucide-react"

interface Student {
  id: string
  firstName: string
  lastName: string
  studentId: string
  present: boolean
}

interface ClassDetails {
  id: string
  name: string
  subject: string
  grade: string
  room: string
  schedule: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  present: boolean
  date: string
}

export default function TeacherAttendancePage() {
  const params = useParams()
  const classId = params.classId as string
  const { getAuthHeaders } = useAuth()
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClassDetails()
    fetchStudents()
    fetchAttendance()
  }, [classId, selectedDate])

  const fetchClassDetails = async () => {
    try {
      const headers = getAuthHeaders()
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/classes/${classId}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setClassDetails(data)
      }
    } catch (error) {
      console.error('Failed to fetch class details:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const headers = getAuthHeaders()
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/enrollments?classId=${classId}`, { headers })
      if (response.ok) {
        const enrollments = await response.json()
        const studentData = enrollments
          .filter((enrollment: any) => enrollment.student && enrollment.student.id)
          .map((enrollment: any) => ({
            id: enrollment.student.id,
            firstName: enrollment.student.firstName,
            lastName: enrollment.student.lastName,
            studentId: enrollment.student.id,
            present: false
          }))
        setStudents(studentData)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      const headers = getAuthHeaders()
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/attendance/class/${classId}?date=${selectedDate}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setAttendance(data)

        // Update student present status based on attendance records
        setStudents(prev => prev.map(student => ({
          ...student,
          present: data.some((record: AttendanceRecord) =>
            record.studentId === student.id && record.status === 'present'
          )
        })))
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, present } : student
    ))
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      const headers = getAuthHeaders()
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const attendanceData = students.map(student => ({
        studentId: student.id,
        classId,
        date: selectedDate,
        present: student.present
      }))

      const response = await fetch(`${backendUrl}/attendance`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: attendanceData })
      })

      if (response.ok) {
        alert('Attendance saved successfully!')
        fetchAttendance() // Refresh attendance data
      } else {
        const error = await response.json()
        alert(`Failed to save attendance: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save attendance:', error)
      alert('Failed to save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: true })))
  }

  const markAllAbsent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: false })))
  }

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const presentCount = students.filter(s => s.present).length
  const totalCount = students.length
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendance - {classDetails?.name}</h1>
            <p className="text-muted-foreground mt-2">
              {classDetails?.subject} • Grade {classDetails?.grade} • Room {classDetails?.room}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Button onClick={saveAttendance} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{totalCount - presentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Attendance</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent}>
                  Mark All Absent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Student List */}
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={student.present}
                        onCheckedChange={(checked) => 
                          handleAttendanceChange(student.id, checked as boolean)
                        }
                      />
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                      </div>
                    </div>
                    <Badge variant={student.present ? "default" : "secondary"}>
                      {student.present ? "Present" : "Absent"}
                    </Badge>
                  </div>
                ))}
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
