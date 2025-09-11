"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Calendar, Clock, CheckCircle, AlertCircle, Upload, Eye } from "lucide-react"
import { toast } from "sonner"

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  classId: string
  className: string
  teacherName: string
  status: 'pending' | 'submitted' | 'graded'
  submission?: {
    id: string
    content: string
    submittedAt: string
    grade?: number
    feedback?: string
  }
}

export function AssignmentViewer() {
  const { user, getAuthHeaders } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [submissionContent, setSubmissionContent] = useState("")
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.studentId) return

      try {
        const headers = getAuthHeaders()
        
        // Get student's enrollments to find their classes
        const enrollmentsRes = await fetch(`/api/enrollments/student/${user.studentId}`, { headers })
        if (!enrollmentsRes.ok) throw new Error("Failed to fetch enrollments")
        
        const enrollments = await enrollmentsRes.json()
        const classIds = enrollments.map((e: any) => e.classId)

        if (classIds.length === 0) {
          setAssignments([])
          setIsLoading(false)
          return
        }

        // Fetch assignments, classes, teachers, and submissions
        const [assignmentsRes, classesRes, teachersRes, submissionsRes] = await Promise.all([
          fetch("/api/assignments", { headers }),
          fetch("/api/classes", { headers }),
          fetch("/api/teachers", { headers }),
          fetch(`/api/submissions?studentId=${user.studentId}`, { headers })
        ])

        const [allAssignments, allClasses, allTeachers, submissions] = await Promise.all([
          assignmentsRes.ok ? assignmentsRes.json() : [],
          classesRes.ok ? classesRes.json() : [],
          teachersRes.ok ? teachersRes.json() : [],
          submissionsRes.ok ? submissionsRes.json() : []
        ])

        // Filter assignments for student's classes
        const studentAssignments = allAssignments.filter((assignment: any) =>
          classIds.includes(assignment.classId)
        )

        // Build assignment data with class and teacher info
        const assignmentsWithDetails = studentAssignments.map((assignment: any) => {
          const classInfo = allClasses.find((cls: any) => cls.id === assignment.classId)
          const teacher = allTeachers.find((t: any) => t.id === classInfo?.teacherId)
          const submission = submissions.find((sub: any) => sub.assignmentId === assignment.id)

          let status: 'pending' | 'submitted' | 'graded' = 'pending'
          if (submission) {
            status = submission.grade !== null ? 'graded' : 'submitted'
          }

          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            maxPoints: assignment.maxPoints,
            classId: assignment.classId,
            className: classInfo?.name || 'Unknown Class',
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher',
            status,
            submission: submission ? {
              id: submission.id,
              content: submission.content,
              submittedAt: submission.submittedAt,
              grade: submission.grade,
              feedback: submission.feedback
            } : undefined
          }
        })

        // Sort by due date
        assignmentsWithDetails.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

        setAssignments(assignmentsWithDetails)
      } catch (error) {
        console.error("Failed to fetch assignments:", error)
        toast.error("Failed to load assignments")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [user, getAuthHeaders])

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!submissionContent.trim()) {
      toast.error("Please enter your submission content")
      return
    }

    setSubmittingId(assignmentId)
    try {
      const headers = getAuthHeaders()
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assignmentId,
          studentId: user?.studentId,
          content: submissionContent
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit assignment")
      }

      const submission = await response.json()

      // Update assignment status
      setAssignments(prev => prev.map(assignment =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              status: 'submitted' as const,
              submission: {
                id: submission.id,
                content: submission.content,
                submittedAt: submission.submittedAt,
                grade: submission.grade,
                feedback: submission.feedback
              }
            }
          : assignment
      ))

      setSubmissionContent("")
      toast.success("Assignment submitted successfully!")
    } catch (error: any) {
      console.error("Failed to submit assignment:", error)
      toast.error(error.message || "Failed to submit assignment")
    } finally {
      setSubmittingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getStatusBadge = (assignment: Assignment) => {
    switch (assignment.status) {
      case 'graded':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Graded</Badge>
      case 'submitted':
        return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>
      case 'pending':
        return isOverdue(assignment.dueDate) 
          ? <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
          : <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Assignments</CardTitle>
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
          <FileText className="h-5 w-5" />
          My Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No assignments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{assignment.title}</h3>
                      {getStatusBadge(assignment)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {assignment.className}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(assignment.dueDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {assignment.maxPoints} points
                      </div>
                    </div>

                    {assignment.submission && (
                      <div className="bg-accent/50 rounded p-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Your Submission</span>
                          <span className="text-xs text-muted-foreground">
                            Submitted: {formatDate(assignment.submission.submittedAt)}
                          </span>
                        </div>
                        {assignment.submission.grade !== null && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Grade:</span>
                            <Badge className="bg-green-600">
                              {assignment.submission.grade}/{assignment.maxPoints}
                            </Badge>
                          </div>
                        )}
                        {assignment.submission.feedback && (
                          <div className="text-sm">
                            <span className="font-medium">Feedback:</span>
                            <p className="mt-1 text-muted-foreground">{assignment.submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(assignment)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{selectedAssignment?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Description</Label>
                            <p className="mt-1 text-sm">{selectedAssignment?.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Class</Label>
                              <p className="mt-1 text-sm">{selectedAssignment?.className}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Teacher</Label>
                              <p className="mt-1 text-sm">{selectedAssignment?.teacherName}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Due Date</Label>
                              <p className="mt-1 text-sm">{selectedAssignment && formatDate(selectedAssignment.dueDate)}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Points</Label>
                              <p className="mt-1 text-sm">{selectedAssignment?.maxPoints}</p>
                            </div>
                          </div>

                          {selectedAssignment?.status === 'pending' && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="submission">Your Submission</Label>
                                <Textarea
                                  id="submission"
                                  placeholder="Enter your assignment submission here..."
                                  value={submissionContent}
                                  onChange={(e) => setSubmissionContent(e.target.value)}
                                  className="mt-1"
                                  rows={6}
                                />
                              </div>
                              <Button
                                onClick={() => selectedAssignment && handleSubmitAssignment(selectedAssignment.id)}
                                disabled={submittingId === selectedAssignment?.id || !submissionContent.trim()}
                                className="w-full"
                              >
                                {submittingId === selectedAssignment?.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Submit Assignment
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
