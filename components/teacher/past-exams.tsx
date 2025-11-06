'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Clock, FileText, Users, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Question {
  id: string
  questionText: string
  questionType: 'MCQ' | 'STRUCTURAL'
  marks: number
  order: number
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  maxWords?: number
}

interface Exam {
  id: string
  title: string
  description: string
  examType: 'MCQ' | 'STRUCTURAL' | 'MIXED'
  duration: number
  totalMarks: number
  passingMarks: number
  startDate: string
  endDate: string
  class: {
    id: string
    name: string
    subject: string
    grade: string
  }
  questions: Question[]
  submissions: any[]
  createdAt: string
}

export default function PastExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setExams(data)
      } else {
        toast.error('Failed to fetch exams')
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to fetch exams')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Exam deleted successfully!')
        fetchExams() // Refresh list
      } else {
        toast.error('Failed to delete exam')
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
      toast.error('Failed to delete exam')
    }
  }

  const viewExamDetails = (exam: Exam) => {
    setSelectedExam(exam)
    setShowDetailsDialog(true)
  }

  const getExamStatus = (exam: Exam) => {
    const now = new Date()
    const startDate = new Date(exam.startDate)
    const endDate = new Date(exam.endDate)

    if (now < startDate) {
      return { label: 'Upcoming', color: 'bg-blue-500' }
    } else if (now >= startDate && now <= endDate) {
      return { label: 'Active', color: 'bg-green-500' }
    } else {
      return { label: 'Ended', color: 'bg-gray-500' }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading exams...</p>
        </div>
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exams Created Yet</h3>
            <p className="text-muted-foreground">
              You haven't created any exams yet. Use the "Create Exam" tab to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {exams.map((exam) => {
          const status = getExamStatus(exam)
          const submissionCount = exam.submissions?.length || 0

          return (
            <Card key={exam.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{exam.title}</CardTitle>
                      <Badge className={`${status.color} text-white`}>
                        {status.label}
                      </Badge>
                      <Badge variant="outline">{exam.examType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{exam.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Class</p>
                      <p className="text-sm font-medium">{exam.class.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">{exam.duration} mins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Marks</p>
                      <p className="text-sm font-medium">{exam.totalMarks}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Submissions</p>
                      <p className="text-sm font-medium">{submissionCount}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start:</span>
                    <span className="font-medium">
                      {format(new Date(exam.startDate), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">End:</span>
                    <span className="font-medium">
                      {format(new Date(exam.endDate), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewExamDetails(exam)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteExam(exam.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Exam Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.title}</DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedExam.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedExam.class.name} - {selectedExam.class.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="font-medium">{selectedExam.class.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedExam.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Marks</p>
                  <p className="font-medium">{selectedExam.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Passing Marks</p>
                  <p className="font-medium">{selectedExam.passingMarks}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="font-medium">{selectedExam.questions.length}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Questions ({selectedExam.questions.length})</h3>
                <div className="space-y-4">
                  {selectedExam.questions.map((question, index) => (
                    <Card key={question.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium">Q{index + 1}. {question.questionText}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{question.questionType}</Badge>
                            <Badge>{question.marks} marks</Badge>
                          </div>
                        </div>
                        {question.questionType === 'MCQ' && (
                          <div className="mt-3 space-y-1 text-sm">
                            <p className={question.correctAnswer === 'A' ? 'text-green-600 font-medium' : ''}>
                              A. {question.optionA}
                            </p>
                            <p className={question.correctAnswer === 'B' ? 'text-green-600 font-medium' : ''}>
                              B. {question.optionB}
                            </p>
                            <p className={question.correctAnswer === 'C' ? 'text-green-600 font-medium' : ''}>
                              C. {question.optionC}
                            </p>
                            <p className={question.correctAnswer === 'D' ? 'text-green-600 font-medium' : ''}>
                              D. {question.optionD}
                            </p>
                          </div>
                        )}
                        {question.questionType === 'STRUCTURAL' && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Max words: {question.maxWords || 'Not specified'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

