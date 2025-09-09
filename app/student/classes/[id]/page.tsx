"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { StudentLayout } from "@/components/layout/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle
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

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'not-started' | 'submitted' | 'graded'
  grade?: number
  maxPoints: number
}

export default function StudentClassDetailsPage() {
  const params = useParams()
  const classId = params.id as string
  const { getAuthHeaders } = useAuth()
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClassDetails()
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800'
      case 'graded':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-orange-100 text-orange-800'
    }
  }

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </StudentLayout>
    )
  }

  if (!classDetails) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Class Not Found</h2>
          <p className="text-muted-foreground">The class you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{classDetails.name}</h1>
            <p className="text-muted-foreground mt-2">{classDetails.subject} • Grade {classDetails.grade}</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Enrolled
          </Badge>
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
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teacher</p>
                  <p className="font-medium">{classDetails.teacherName}</p>
                </div>
              </div>
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
                  <p className="font-medium">{classDetails.enrolledCount || 0}/{classDetails.capacity}</p>
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
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(assignment.status)}
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status === 'not-started' ? 'Not Started' : 
                             assignment.status === 'submitted' ? 'Submitted' : 'Graded'}
                          </Badge>
                          {assignment.status === 'graded' && (
                            <div className="text-right">
                              <p className="font-medium">{assignment.grade}/{assignment.maxPoints}</p>
                              <p className="text-sm text-muted-foreground">
                                {Math.round((assignment.grade! / assignment.maxPoints) * 100)}%
                              </p>
                            </div>
                          )}
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
                <CardTitle>Course Materials</CardTitle>
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
                <CardTitle>Grade Summary</CardTitle>
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
      </div>
    </StudentLayout>
  )
}
