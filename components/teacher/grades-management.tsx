"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, TrendingUp, Users, Eye, Edit } from "lucide-react"

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  class: {
    name: string
    subject: string
  }
  submissions: Submission[]
  _count: {
    submissions: number
  }
}

interface Submission {
  id: string
  content: string
  submittedAt: string
  grade?: number
  feedback?: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentId: string
  }
}

interface GradeStats {
  totalStudents: number
  averageGrade: number
  pendingGrades: number
  gradeTrend: number
}

export function GradesManagement() {
  const { user, getAuthHeaders } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<GradeStats>({
    totalStudents: 0,
    averageGrade: 0,
    pendingGrades: 0,
    gradeTrend: 0
  })
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeInput, setGradeInput] = useState("")
  const [feedbackInput, setFeedbackInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isGrading, setIsGrading] = useState(false)

  useEffect(() => {
    fetchAssignments()
    fetchStats()
  }, [])

  const fetchAssignments = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/assignments', { headers })
      if (response.ok) {
        const data = await response.json()
        const teacherAssignments = data.filter((a: any) => a.teacherId === user?.teacherId)
        setAssignments(teacherAssignments)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const headers = getAuthHeaders()
      
      // Fetch classes to get total students
      const classesRes = await fetch('/api/classes', { headers })
      if (classesRes.ok) {
        const classes = await classesRes.json()
        const teacherClasses = classes.filter((c: any) => c.teacherId === user?.teacherId)
        
        let totalStudents = 0
        for (const cls of teacherClasses) {
          const enrollmentsRes = await fetch(`/api/enrollments?classId=${cls.id}`, { headers })
          if (enrollmentsRes.ok) {
            const enrollments = await enrollmentsRes.json()
            totalStudents += enrollments.length
          }
        }

        // Calculate grade statistics from assignments
        const assignmentsRes = await fetch('/api/assignments', { headers })
        if (assignmentsRes.ok) {
          const assignments = await assignmentsRes.json()
          const teacherAssignments = assignments.filter((a: any) => a.teacherId === user?.teacherId)
          
          let totalGrades = 0
          let gradeCount = 0
          let pendingGrades = 0

          teacherAssignments.forEach((assignment: any) => {
            if (assignment.submissions) {
              assignment.submissions.forEach((submission: any) => {
                if (submission.grade !== null && submission.grade !== undefined) {
                  totalGrades += (submission.grade / assignment.maxPoints) * 100
                  gradeCount++
                } else {
                  pendingGrades++
                }
              })
            }
          })

          const averageGrade = gradeCount > 0 ? totalGrades / gradeCount : 0

          setStats({
            totalStudents,
            averageGrade: Math.round(averageGrade * 10) / 10,
            pendingGrades,
            gradeTrend: 2.1 // This would be calculated based on historical data
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !gradeInput) return

    setIsGrading(true)
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`/api/assignments/${selectedSubmission.id}/grade`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseFloat(gradeInput),
          feedback: feedbackInput
        })
      })

      if (response.ok) {
        // Refresh assignments and stats
        await fetchAssignments()
        await fetchStats()
        setSelectedSubmission(null)
        setGradeInput("")
        setFeedbackInput("")
      }
    } catch (error) {
      console.error('Failed to grade submission:', error)
    } finally {
      setIsGrading(false)
    }
  }

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGradeInput(submission.grade?.toString() || "")
    setFeedbackInput(submission.feedback || "")
  }

  const getPendingSubmissions = (assignment: Assignment) => {
    return assignment.submissions?.filter(s => s.grade === null || s.grade === undefined).length || 0
  }

  const getGradedSubmissions = (assignment: Assignment) => {
    return assignment.submissions?.filter(s => s.grade !== null && s.grade !== undefined).length || 0
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grade Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.averageGrade.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingGrades}</div>
            <p className="text-xs text-muted-foreground">Assignments to grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grade Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold text-green-600">+{stats.gradeTrend}%</div>
            </div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignments to Grade
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
              {assignments.map((assignment) => {
                const pendingCount = getPendingSubmissions(assignment)
                const gradedCount = getGradedSubmissions(assignment)
                const totalSubmissions = assignment.submissions?.length || 0

                return (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assignment.class.name} • Due: {new Date(assignment.dueDate).toLocaleDateString()} • {assignment.maxPoints} points
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {pendingCount > 0 ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <Users className="h-3 w-3 mr-1" />
                          {pendingCount} Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Users className="h-3 w-3 mr-1" />
                          All Graded
                        </Badge>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View Submissions ({totalSubmissions})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{assignment.title} - Submissions</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {assignment.submissions?.map((submission) => (
                              <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {submission.student.firstName} {submission.student.lastName}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {submission.student.studentId} • Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                                  </p>
                                  {submission.grade !== null && submission.grade !== undefined && (
                                    <p className="text-sm font-medium text-green-600">
                                      Grade: {submission.grade}/{assignment.maxPoints} ({Math.round((submission.grade / assignment.maxPoints) * 100)}%)
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => openGradingDialog(submission)}
                                  variant={submission.grade !== null ? "outline" : "default"}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {submission.grade !== null ? "Edit Grade" : "Grade"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grading Dialog */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Grade Submission - {selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Submission Content:</label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedSubmission.content}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Grade (out of {assignments.find(a => a.submissions?.some(s => s.id === selectedSubmission.id))?.maxPoints}):</label>
                <Input
                  type="number"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Enter grade"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Feedback (optional):</label>
                <Textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Enter feedback for the student"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Cancel
                </Button>
                <Button onClick={handleGradeSubmission} disabled={isGrading || !gradeInput}>
                  {isGrading ? "Saving..." : "Save Grade"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
