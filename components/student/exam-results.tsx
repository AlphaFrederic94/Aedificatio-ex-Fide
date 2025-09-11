'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  Target,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

interface ExamResult {
  id: string
  examId: string
  studentId: string
  startedAt: string
  submittedAt: string
  isSubmitted: boolean
  totalScore: number
  mcqScore: number
  structuralScore: number
  isGraded: boolean
  exam: {
    id: string
    title: string
    description: string
    totalMarks: number
    passingMarks: number
    duration: number
    class: {
      name: string
      subject: string
    }
  }
  answers: Array<{
    id: string
    questionId: string
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
      optionA?: string
      optionB?: string
      optionC?: string
      optionD?: string
      correctAnswer?: string
    }
  }>
}

export default function ExamResults() {
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null)

  useEffect(() => {
    fetchExamResults()
  }, [])

  const fetchExamResults = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Please log in to view your grades')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/exams/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const exams = await response.json()
        // Filter only exams with submissions (completed exams)
        const completedExams = exams.filter((exam: any) => exam.submissions.length > 0)
        
        // Fetch detailed results for each completed exam
        const detailedResults = await Promise.all(
          completedExams.map(async (exam: any) => {
            const submissionId = exam.submissions[0].id
            const detailResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/exam-submissions/${submissionId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json()
              return {
                ...detailData,
                exam: exam
              }
            }
            return null
          })
        )

        setExamResults(detailedResults.filter(result => result !== null))
      } else {
        toast.error('Failed to fetch exam results')
      }
    } catch (error) {
      console.error('Error fetching exam results:', error)
      toast.error('Error loading exam results')
    } finally {
      setIsLoading(false)
    }
  }

  const getGradeStatus = (result: ExamResult) => {
    if (!result.isGraded) return { status: 'pending', color: 'bg-yellow-500', text: 'Pending' }
    if (result.totalScore >= result.exam.passingMarks) {
      return { status: 'pass', color: 'bg-green-500', text: 'Pass' }
    }
    return { status: 'fail', color: 'bg-red-500', text: 'Fail' }
  }

  const getPercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100)
  }

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 85) return 'A'
    if (percentage >= 80) return 'A-'
    if (percentage >= 75) return 'B+'
    if (percentage >= 70) return 'B'
    if (percentage >= 65) return 'B-'
    if (percentage >= 60) return 'C+'
    if (percentage >= 55) return 'C'
    if (percentage >= 50) return 'C-'
    return 'F'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    )
  }

  if (examResults.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Exam Results Yet</h3>
          <p className="text-muted-foreground">
            You haven't completed any exams yet. Take some exams to see your results here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Exams</p>
                <p className="text-2xl font-bold">{examResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold">
                  {examResults.filter(r => r.isGraded && r.totalScore >= r.exam.passingMarks).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">
                  {examResults.length > 0 
                    ? Math.round(examResults.reduce((sum, r) => sum + r.totalScore, 0) / examResults.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Results List */}
      <div className="grid gap-4">
        {examResults.map((result) => {
          const gradeStatus = getGradeStatus(result)
          const percentage = getPercentage(result.totalScore, result.exam.totalMarks)
          const gradeLetter = getGradeLetter(percentage)

          return (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{result.exam.title}</h3>
                      <Badge className={`${gradeStatus.color} text-white`}>
                        {gradeStatus.text}
                      </Badge>
                      <Badge variant="outline" className="font-bold">
                        {gradeLetter}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{result.exam.class.name} - {result.exam.class.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{result.totalScore}/{result.exam.totalMarks} ({percentage}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(result.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">MCQ Score: </span>
                          <span className="font-medium">{result.mcqScore}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Structural Score: </span>
                          <span className="font-medium">{result.structuralScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedResult(result)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{result.exam.title} - Detailed Results</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh]">
                        {selectedResult && (
                          <div className="space-y-6 p-4">
                            {/* Exam Summary */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Final Score</p>
                                <p className="text-2xl font-bold">{selectedResult.totalScore}/{selectedResult.exam.totalMarks}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Grade</p>
                                <p className="text-2xl font-bold">{getGradeLetter(getPercentage(selectedResult.totalScore, selectedResult.exam.totalMarks))}</p>
                              </div>
                            </div>

                            {/* Question-by-Question Results */}
                            <div className="space-y-4">
                              <h4 className="font-semibold">Question-by-Question Results</h4>
                              {selectedResult.answers
                                .sort((a, b) => a.question.order - b.question.order)
                                .map((answer) => (
                                <Card key={answer.id} className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline">Q{answer.question.order}</Badge>
                                          <Badge variant={answer.question.questionType === 'MCQ' ? 'default' : 'secondary'}>
                                            {answer.question.questionType}
                                          </Badge>
                                          <span className="text-sm text-muted-foreground">
                                            {answer.marksAwarded}/{answer.question.marks} marks
                                          </span>
                                        </div>
                                        <p className="font-medium mb-2">{answer.question.questionText}</p>
                                        
                                        {answer.question.questionType === 'MCQ' && (
                                          <div className="space-y-1 text-sm">
                                            <p><strong>Your Answer:</strong> {answer.mcqAnswer}</p>
                                            {answer.question.correctAnswer && (
                                              <p><strong>Correct Answer:</strong> {answer.question.correctAnswer}</p>
                                            )}
                                          </div>
                                        )}
                                        
                                        {answer.question.questionType === 'STRUCTURAL' && answer.textAnswer && (
                                          <div className="space-y-2">
                                            <p className="text-sm font-medium">Your Answer:</p>
                                            <div className="p-3 bg-muted rounded text-sm">
                                              {answer.textAnswer}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {answer.feedback && (
                                          <div className="mt-2 p-3 bg-blue-50 rounded">
                                            <p className="text-sm font-medium text-blue-800">Teacher Feedback:</p>
                                            <p className="text-sm text-blue-700">{answer.feedback}</p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {answer.question.questionType === 'MCQ' ? (
                                          answer.isCorrect ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                          ) : (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                          )
                                        ) : (
                                          <div className="text-right">
                                            <div className="text-sm font-medium">
                                              {answer.marksAwarded}/{answer.question.marks}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {Math.round((answer.marksAwarded / answer.question.marks) * 100)}%
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
