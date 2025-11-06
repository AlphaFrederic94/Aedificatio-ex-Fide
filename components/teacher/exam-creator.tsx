'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Clock, Calendar, BookOpen, FileText, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id?: string
  questionText: string
  questionType: 'MCQ' | 'STRUCTURAL'
  marks: number
  order: number
  // MCQ specific
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  // Structural specific
  maxWords?: number
}

interface ExamFormData {
  title: string
  description: string
  classId: string
  examType: 'MCQ' | 'STRUCTURAL' | 'MIXED'
  duration: number
  totalMarks: number
  passingMarks: number
  startDate: string
  endDate: string
  questions: Question[]
}

interface Class {
  id: string
  name: string
  subject: string
  grade: string
}

export default function ExamCreator() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  
  const [examData, setExamData] = useState<ExamFormData>({
    title: '',
    description: '',
    classId: '',
    examType: 'MIXED',
    duration: 60,
    totalMarks: 0,
    passingMarks: 0,
    startDate: '',
    endDate: '',
    questions: []
  })

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    questionText: '',
    questionType: 'MCQ',
    marks: 1,
    order: 1,
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    maxWords: 100
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    // Auto-calculate total marks
    const total = examData.questions.reduce((sum, q) => sum + q.marks, 0)
    setExamData(prev => ({ ...prev, totalMarks: total }))
  }, [examData.questions])

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to fetch classes')
    }
  }

  const addQuestion = () => {
    const newQuestion = {
      ...currentQuestion,
      order: examData.questions.length + 1
    }
    
    setExamData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
    
    // Reset form
    setCurrentQuestion({
      questionText: '',
      questionType: 'MCQ',
      marks: 1,
      order: 1,
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      maxWords: 100
    })
    
    setShowQuestionDialog(false)
    toast.success('Question added successfully')
  }

  const removeQuestion = (index: number) => {
    setExamData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 }))
    }))
    toast.success('Question removed')
  }

  const createExam = async () => {
    if (!examData.title || !examData.classId || examData.questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question')
      return
    }

    if (!examData.startDate || !examData.endDate) {
      toast.error('Please set start and end dates for the exam')
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'

      console.log('Creating exam with data:', examData)
      console.log('Backend URL:', backendUrl)

      const response = await fetch(`${backendUrl}/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(examData)
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const createdExam = await response.json()
        console.log('Exam created successfully:', createdExam)

        toast.success('🎉 Exam created successfully!', {
          description: `"${examData.title}" has been created for your class.`,
          duration: 5000
        })

        // Reset form
        setExamData({
          title: '',
          description: '',
          classId: '',
          examType: 'MIXED',
          duration: 60,
          totalMarks: 0,
          passingMarks: 0,
          startDate: '',
          endDate: '',
          questions: []
        })
      } else {
        const error = await response.json()
        console.error('Error response:', error)
        toast.error(`Failed to create exam: ${error.error || error.details || 'Unknown error'}`, {
          description: error.details || error.message,
          duration: 7000
        })
      }
    } catch (error) {
      console.error('Error creating exam:', error)
      toast.error('Failed to create exam. Please check your connection and try again.', {
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Exam
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                value={examData.title}
                onChange={(e) => setExamData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mid-term Mathematics Exam"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={examData.classId} onValueChange={(value) => setExamData(prev => ({ ...prev, classId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject} (Grade {cls.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={examData.description}
              onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the exam..."
              rows={3}
            />
          </div>

          {/* Exam Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examType">Exam Type</Label>
              <Select value={examData.examType} onValueChange={(value: any) => setExamData(prev => ({ ...prev, examType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">MCQ Only</SelectItem>
                  <SelectItem value="STRUCTURAL">Structural Only</SelectItem>
                  <SelectItem value="MIXED">Mixed (MCQ + Structural)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={examData.duration}
                onChange={(e) => setExamData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                value={examData.totalMarks}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingMarks">Passing Marks</Label>
              <Input
                id="passingMarks"
                type="number"
                value={examData.passingMarks}
                onChange={(e) => setExamData(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 0 }))}
                min="0"
                max={examData.totalMarks}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={examData.startDate}
                onChange={(e) => setExamData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={examData.endDate}
                onChange={(e) => setExamData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Questions ({examData.questions.length})
            </CardTitle>
            
            <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select 
                        value={currentQuestion.questionType} 
                        onValueChange={(value: any) => setCurrentQuestion(prev => ({ ...prev, questionType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCQ">Multiple Choice</SelectItem>
                          <SelectItem value="STRUCTURAL">Structural/Essay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={currentQuestion.questionText}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                      placeholder="Enter your question here..."
                      rows={3}
                    />
                  </div>

                  {currentQuestion.questionType === 'MCQ' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Option A</Label>
                          <Input
                            value={currentQuestion.optionA}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, optionA: e.target.value }))}
                            placeholder="Option A"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Option B</Label>
                          <Input
                            value={currentQuestion.optionB}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, optionB: e.target.value }))}
                            placeholder="Option B"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Option C</Label>
                          <Input
                            value={currentQuestion.optionC}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, optionC: e.target.value }))}
                            placeholder="Option C"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Option D</Label>
                          <Input
                            value={currentQuestion.optionD}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, optionD: e.target.value }))}
                            placeholder="Option D"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Select 
                          value={currentQuestion.correctAnswer} 
                          onValueChange={(value) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {currentQuestion.questionType === 'STRUCTURAL' && (
                    <div className="space-y-2">
                      <Label>Maximum Words (optional)</Label>
                      <Input
                        type="number"
                        value={currentQuestion.maxWords}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, maxWords: parseInt(e.target.value) || undefined }))}
                        placeholder="e.g., 200"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addQuestion} disabled={!currentQuestion.questionText}>
                      Add Question
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {examData.questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions added yet. Click "Add Question" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examData.questions.map((question, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Q{question.order}</Badge>
                          <Badge variant={question.questionType === 'MCQ' ? 'default' : 'secondary'}>
                            {question.questionType}
                          </Badge>
                          <Badge variant="outline">{question.marks} marks</Badge>
                        </div>
                        <p className="text-sm font-medium mb-2">{question.questionText}</p>
                        
                        {question.questionType === 'MCQ' && (
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>A) {question.optionA}</div>
                            <div>B) {question.optionB}</div>
                            <div>C) {question.optionC}</div>
                            <div>D) {question.optionD}</div>
                            <div className="col-span-2 flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Correct: {question.correctAnswer}
                            </div>
                          </div>
                        )}
                        
                        {question.questionType === 'STRUCTURAL' && question.maxWords && (
                          <p className="text-xs text-muted-foreground">Max words: {question.maxWords}</p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Exam Button */}
      <div className="flex justify-end">
        <Button 
          onClick={createExam} 
          disabled={isLoading || !examData.title || !examData.classId || examData.questions.length === 0}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Create Exam
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
