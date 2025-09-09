"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TeacherLayout } from "@/components/layout/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentForm } from "@/components/teacher/assignment-form"
import { useAuth } from "@/contexts/auth-context"
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  FileText,
  Plus,
  Eye
} from "lucide-react"

interface ClassDetails {
  id: string
  name: string
  subject: string
  grade: string
  teacherName: string
  room: string
  schedule: string
  description: string
  capacity: number
  enrolledCount: number
  startDate: string
  endDate: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  studentId: string
  email: string
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  submissionCount: number
  totalStudents: number
}

export default function TeacherClassDetailsPage() {
  const params = useParams()
  const classId = params.id as string
  const { getAuthHeaders } = useAuth()
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)

  useEffect(() => {
    fetchClassDetails()
    fetchStudents()
    fetchAssignments()
  }, [classId])

  const fetchClassDetails = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`/api/classes/${classId}`, { headers })
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
      const response = await fetch(`/api/enrollments?classId=${classId}`, { headers })
      if (response.ok) {
        const enrollments = await response.json()
        const studentData = enrollments
          .map((enrollment: any) => enrollment.student)
          .filter((student: any) => student && student.firstName) // Filter out invalid student data
        setStudents(studentData)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`/api/assignments/class/${classId}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignmentSuccess = () => {
    fetchAssignments() // Refresh assignments list
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </TeacherLayout>
    )
  }

  if (!classDetails) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Class Not Found</h2>
          <p className="text-muted-foreground">The class you're looking for doesn't exist or you don't have access to it.</p>
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
            <h1 className="text-3xl font-bold">{classDetails.name}</h1>
            <p className="text-muted-foreground mt-2">{classDetails.subject} • Grade {classDetails.grade}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href={`/teacher/attendance/${classId}`}>
                <UserCheck className="h-4 w-4 mr-2" />
                Take Attendance
              </a>
            </Button>
            <Button onClick={() => setShowAssignmentForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>
        </div>

        {/* Class Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Class Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{classDetails.room}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Schedule</p>
                  <p className="font-medium">{classDetails.schedule}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment</p>
                  <p className="font-medium">{students.length}/{classDetails.capacity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {new Date(classDetails.startDate).toLocaleDateString()} - {new Date(classDetails.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{classDetails.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students ({students.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{student.firstName} {student.lastName}</h4>
                          <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assignments</CardTitle>
                  <Button onClick={() => setShowAssignmentForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No assignments created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">{assignment.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()} • {assignment.maxPoints} points
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {assignment.submissionCount || 0}/{assignment.totalStudents || students.length} submitted
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Materials</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No materials uploaded yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <Card>
              <CardHeader>
                <CardTitle>Grade Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No grades available yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Form */}
        <AssignmentForm
          isOpen={showAssignmentForm}
          onClose={() => setShowAssignmentForm(false)}
          onSuccess={handleAssignmentSuccess}
          classId={classId}
        />
      </div>
    </TeacherLayout>
  )
}
