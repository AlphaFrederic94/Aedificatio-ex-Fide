'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Users, CheckCircle, Clock, Trophy, Eye, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface ExamSubmission {
  id: string
  startedAt: string
  submittedAt: string
  isSubmitted: boolean
  totalScore: number
  mcqScore: number
  structuralScore: number
  isGraded: boolean
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  answers: StudentAnswer[]
}

interface StudentAnswer {
  id: string
  mcqAnswer?: string
  textAnswer?: string
  isCorrect?: boolean
  marksAwarded: number
  feedback?: string
  question: {
    id: string
    questionText: string
    questionType: 'MCQ' | 'STRUCTURAL'
    marks: number
    order: number
    correctAnswer?: string
    optionA?: string
    optionB?: string
    optionC?: string
    optionD?: string
  }
}

interface Exam {
  id: string
  title: string
  description: string
  totalMarks: number
  passingMarks: number
  class: {
    name: string
    subject: string
  }
  submissions: ExamSubmission[]
}

interface GradeData {
  questionId: string
  marksAwarded: number
  feedback: string
}

export default function ExamGrading() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null)
  const [grades, setGrades] = useState<Record<string, GradeData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setExams(data.filter((exam: Exam) => exam.submissions.length > 0))
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to fetch exams')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubmissionDetails = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/exam-submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const submission = await response.json()
        setSelectedSubmission(submission)
        
        // Initialize grades from existing answers
        const initialGrades: Record<string, GradeData> = {}
        submission.answers.forEach((answer: StudentAnswer) => {
          if (answer.question.questionType === 'STRUCTURAL') {
            initialGrades[answer.question.id] = {
              questionId: answer.question.id,
              marksAwarded: answer.marksAwarded,
              feedback: answer.feedback || ''
            }
          }
        })
        setGrades(initialGrades)
      }
    } catch (error) {
      console.error('Error loading submission:', error)
      toast.error('Failed to load submission details')
    }
  }

  const saveGrades = async () => {
    if (!selectedSubmission) return

    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const gradesArray = Object.values(grades)
      
      const response = await fetch(`/api/exam-submissions/grade/${selectedSubmission.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grades: gradesArray })
      })

      if (response.ok) {
        toast.success('Grades saved successfully!')
        setSelectedSubmission(null)
        fetchExams() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save grades')
      }
    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Failed to save grades')
    } finally {
      setIsSaving(false)
    }
  }

  const getSubmissionStats = (exam: Exam) => {
    const total = exam.submissions.length
    const graded = exam.submissions.filter(s => s.isGraded).length
    const pending = total - graded
    
    return { total, graded, pending }
  }

  const getGradeColor = (score: number, totalMarks: number, passingMarks: number) => {
    const percentage = (score / totalMarks) * 100
    const passingPercentage = (passingMarks / totalMarks) * 100
    
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= passingPercentage) return 'text-blue-600'
    return 'text-red-600'
  }

  if (selectedSubmission) {
    const structuralQuestions = selectedSubmission.answers.filter(a => a.question.questionType === 'STRUCTURAL')
    const mcqQuestions = selectedSubmission.answers.filter(a => a.question.questionType === 'MCQ')
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Grading: {selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedExam?.title} - {selectedExam?.class.name}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{selectedSubmission.totalScore}</div>
                  <p className="text-xs text-muted-foreground">Current Score</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{selectedExam?.totalMarks}</div>
                  <p className="text-xs text-muted-foreground">Total Marks</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Back to List
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* MCQ Results (Read-only) */}
        {mcqQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Multiple Choice Questions (Auto-graded)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mcqQuestions.map((answer) => (
                  <Card key={answer.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Q{answer.question.order}</Badge>
                            <Badge variant={answer.isCorrect ? 'default' : 'destructive'}>
                              {answer.isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                            <Badge variant="outline">{answer.marksAwarded}/{answer.question.marks} marks</Badge>
                          </div>
                          
                          <p className="text-sm font-medium mb-2">{answer.question.questionText}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            {['A', 'B', 'C', 'D'].map((option) => (
                              <div 
                                key={option} 
                                className={`p-2 rounded ${
                                  option === answer.question.correctAnswer ? 'bg-green-100 text-green-800' :
                                  option === answer.mcqAnswer ? 'bg-red-100 text-red-800' :
                                  'bg-gray-50'
                                }`}
                              >
                                {option}) {answer.question[`option${option}` as keyof typeof answer.question]}
                                {option === answer.question.correctAnswer && ' ✓'}
                                {option === answer.mcqAnswer && option !== answer.question.correctAnswer && ' ✗'}
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Student answered: <strong>{answer.mcqAnswer}</strong> | 
                            Correct answer: <strong>{answer.question.correctAnswer}</strong>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Structural Questions (Manual grading) */}
        {structuralQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Structural Questions (Manual Grading Required)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {structuralQuestions.map((answer) => (
                  <Card key={answer.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Q{answer.question.order}</Badge>
                          <Badge variant="secondary">Structural</Badge>
                          <Badge variant="outline">Max: {answer.question.marks} marks</Badge>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Question:</Label>
                          <p className="text-sm mt-1">{answer.question.questionText}</p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Student's Answer:</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">
                              {answer.textAnswer || 'No answer provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`marks-${answer.question.id}`}>
                              Marks Awarded (out of {answer.question.marks})
                            </Label>
                            <Input
                              id={`marks-${answer.question.id}`}
                              type="number"
                              min="0"
                              max={answer.question.marks}
                              value={grades[answer.question.id]?.marksAwarded || 0}
                              onChange={(e) => setGrades(prev => ({
                                ...prev,
                                [answer.question.id]: {
                                  ...prev[answer.question.id],
                                  questionId: answer.question.id,
                                  marksAwarded: parseInt(e.target.value) || 0
                                }
                              }))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`feedback-${answer.question.id}`}>
                              Feedback (optional)
                            </Label>
                            <Textarea
                              id={`feedback-${answer.question.id}`}
                              placeholder="Provide feedback for the student..."
                              value={grades[answer.question.id]?.feedback || ''}
                              onChange={(e) => setGrades(prev => ({
                                ...prev,
                                [answer.question.id]: {
                                  ...prev[answer.question.id],
                                  questionId: answer.question.id,
                                  feedback: e.target.value
                                }
                              }))}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveGrades} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Save Grades
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Exam Grading
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exams with submissions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const stats = getSubmissionStats(exam)
                
                return (
                  <Card key={exam.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{exam.title}</h3>
                            <Badge variant="outline">{exam.class.name}</Badge>
                            <Badge variant="secondary">{exam.class.subject}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {exam.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {stats.total} submissions
                            </div>
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              {stats.graded} graded
                            </div>
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              {stats.pending} pending
                            </div>
                            <div>
                              Total: {exam.totalMarks} marks
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => setSelectedExam(exam)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Submissions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedExam?.title} - Submissions
            </DialogTitle>
          </DialogHeader>
          
          {selectedExam && (
            <div className="space-y-4">
              {selectedExam.submissions.map((submission) => (
                <Card key={submission.id} className={`border-l-4 ${
                  submission.isGraded ? 'border-l-green-500' : 'border-l-orange-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {submission.student.firstName} {submission.student.lastName}
                          </h4>
                          <Badge variant={submission.isGraded ? 'default' : 'secondary'}>
                            {submission.isGraded ? 'Graded' : 'Pending'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {submission.student.email}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                          <div className={getGradeColor(submission.totalScore, selectedExam.totalMarks, selectedExam.passingMarks)}>
                            Score: {submission.totalScore}/{selectedExam.totalMarks}
                          </div>
                          <div>
                            MCQ: {submission.mcqScore} | Structural: {submission.structuralScore}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => loadSubmissionDetails(submission.id)}
                        variant={submission.isGraded ? 'outline' : 'default'}
                        className="gap-2"
                      >
                        {submission.isGraded ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Review
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4" />
                            Grade
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
