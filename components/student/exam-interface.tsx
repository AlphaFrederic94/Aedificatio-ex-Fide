'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Clock, FileText, CheckCircle, AlertCircle, BookOpen, Timer } from 'lucide-react'
import { toast } from 'sonner'

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
  maxWords?: number
}

interface Exam {
  id: string
  title: string
  description: string
  duration: number
  totalMarks: number
  passingMarks: number
  startDate: string
  endDate: string
  class: {
    name: string
    subject: string
  }
  questions: Question[]
  submissions: any[]
}

interface ExamSubmission {
  id: string
  startedAt: string
  submittedAt?: string
  isSubmitted: boolean
  exam: Exam
}

interface StudentAnswer {
  questionId: string
  mcqAnswer?: string
  textAnswer?: string
}

export default function ExamInterface() {
  const [availableExams, setAvailableExams] = useState<Exam[]>([])
  const [currentExam, setCurrentExam] = useState<ExamSubmission | null>(null)
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    fetchAvailableExams()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (currentExam && !currentExam.isSubmitted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            submitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentExam, timeRemaining])

  const fetchAvailableExams = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/exams/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableExams(data)
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to fetch available exams')
    }
  }

  const startExam = async (examId: string) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/exam-submissions/start/${examId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const submission = await response.json()
        setCurrentExam(submission)
        
        // Calculate time remaining
        const startTime = new Date(submission.startedAt).getTime()
        const duration = submission.exam.duration * 60 * 1000 // Convert to milliseconds
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000))
        
        setTimeRemaining(remaining)
        toast.success('Exam started! Good luck!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start exam')
      }
    } catch (error) {
      console.error('Error starting exam:', error)
      toast.error('Failed to start exam')
    } finally {
      setIsLoading(false)
    }
  }

  const saveAnswer = async (questionId: string, answer: StudentAnswer) => {
    if (!currentExam) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/exam-submissions/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionId: currentExam.id,
          questionId,
          ...answer
        })
      })

      if (response.ok) {
        setAnswers(prev => ({ ...prev, [questionId]: answer }))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save answer')
      }
    } catch (error) {
      console.error('Error saving answer:', error)
      toast.error('Failed to save answer')
    }
  }

  const submitExam = async () => {
    if (!currentExam) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/exam-submissions/submit/${currentExam.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Exam submitted successfully!')
        setCurrentExam(null)
        setAnswers({})
        setTimeRemaining(0)
        fetchAvailableExams() // Refresh available exams
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit exam')
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error('Failed to submit exam')
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getTotalQuestions = () => {
    return currentExam?.exam.questions.length || 0
  }

  const getProgressPercentage = () => {
    const total = getTotalQuestions()
    const answered = getAnsweredCount()
    return total > 0 ? (answered / total) * 100 : 0
  }

  if (currentExam) {
    const currentQuestion = currentExam.exam.questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === currentExam.exam.questions.length - 1

    return (
      <div className="space-y-6">
        {/* Exam Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {currentExam.exam.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentExam.exam.class.name} - {currentExam.exam.class.subject}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Timer className="h-4 w-4" />
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-xs text-muted-foreground">Time Remaining</p>
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {getAnsweredCount()}/{getTotalQuestions()}
                  </div>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
              </div>
            </div>
            
            <Progress value={getProgressPercentage()} className="w-full" />
          </CardHeader>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Question {currentQuestion.order}</Badge>
                <Badge variant={currentQuestion.questionType === 'MCQ' ? 'default' : 'secondary'}>
                  {currentQuestion.questionType}
                </Badge>
                <Badge variant="outline">{currentQuestion.marks} marks</Badge>
              </div>
              
              {timeRemaining <= 300 && ( // Show warning when 5 minutes left
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Time running out!</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-base">{currentQuestion.questionText}</p>
            </div>

            {currentQuestion.questionType === 'MCQ' && (
              <RadioGroup
                value={answers[currentQuestion.id]?.mcqAnswer || ''}
                onValueChange={(value) => saveAnswer(currentQuestion.id, { questionId: currentQuestion.id, mcqAnswer: value })}
              >
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${option}`} />
                      <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{option})</span> {currentQuestion[`option${option}` as keyof Question]}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {currentQuestion.questionType === 'STRUCTURAL' && (
              <div className="space-y-2">
                <Textarea
                  value={answers[currentQuestion.id]?.textAnswer || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setAnswers(prev => ({ 
                      ...prev, 
                      [currentQuestion.id]: { questionId: currentQuestion.id, textAnswer: value }
                    }))
                  }}
                  onBlur={() => {
                    const answer = answers[currentQuestion.id]
                    if (answer?.textAnswer) {
                      saveAnswer(currentQuestion.id, answer)
                    }
                  }}
                  placeholder="Type your answer here..."
                  rows={8}
                  className="resize-none"
                />
                {currentQuestion.maxWords && (
                  <p className="text-xs text-muted-foreground">
                    Maximum {currentQuestion.maxWords} words
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentExam.exam.questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? 'default' : answers[currentExam.exam.questions[index].id] ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className="w-8 h-8 p-0"
              >
                {index + 1}
              </Button>
            ))}
          </div>

          {isLastQuestion ? (
            <Button onClick={() => setShowConfirmDialog(true)} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Submit Exam
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(currentExam.exam.questions.length - 1, prev + 1))}
            >
              Next
            </Button>
          )}
        </div>

        {/* Submit Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Exam?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to submit your exam? You won't be able to make changes after submission.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Questions Answered:</span>
                  <span className="font-medium">{getAnsweredCount()}/{getTotalQuestions()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Remaining:</span>
                  <span className="font-medium">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Continue Exam
                </Button>
                <Button onClick={submitExam} disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Exam'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Available Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableExams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exams available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableExams.map((exam) => {
                const hasSubmission = exam.submissions.length > 0
                const isActive = new Date() >= new Date(exam.startDate) && new Date() <= new Date(exam.endDate)
                
                return (
                  <Card key={exam.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{exam.title}</h3>
                            <Badge variant={isActive ? 'default' : 'secondary'}>
                              {isActive ? 'Active' : 'Scheduled'}
                            </Badge>
                            {hasSubmission && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {exam.class.name} - {exam.class.subject}
                          </p>
                          
                          {exam.description && (
                            <p className="text-sm mb-3">{exam.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exam.duration} minutes
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {exam.questions.length} questions
                            </div>
                            <div>
                              Total: {exam.totalMarks} marks
                            </div>
                            <div>
                              Pass: {exam.passingMarks} marks
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-muted-foreground">
                            <div>Start: {new Date(exam.startDate).toLocaleString()}</div>
                            <div>End: {new Date(exam.endDate).toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => startExam(exam.id)}
                          disabled={!isActive || hasSubmission || isLoading}
                          className="gap-2"
                        >
                          {hasSubmission ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Completed
                            </>
                          ) : isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Starting...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4" />
                              Start Exam
                            </>
                          )}
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
    </div>
  )
}
