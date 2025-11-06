"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  Award,
  BarChart3,
  Eye,
  BookOpen,
  Target,
  Trophy
} from "lucide-react"

interface StudentGrade {
  studentId: string
  studentName: string
  studentEmail: string
  className: string
  classId: string
  exams: ExamResult[]
  averageScore: number
  totalExams: number
  passedExams: number
}

interface ExamResult {
  examId: string
  examTitle: string
  totalScore: number
  totalMarks: number
  mcqScore: number
  structuralScore: number
  isGraded: boolean
  submittedAt: string
  percentage: number
  passed: boolean
}

export function StudentGradesView() {
  const { user, getAuthHeaders } = useAuth()
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageClassScore: 0,
    totalExamsGraded: 0,
    passRate: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders()
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'

      // Fetch teacher's classes
      const classesRes = await fetch(`${backendUrl}/classes`, { headers })
      const allClasses = await classesRes.json()
      const teacherClasses = allClasses.filter((c: any) => c.teacherId === user?.teacherId)
      setClasses(teacherClasses)

      // Fetch exams for each class
      const examsRes = await fetch(`${backendUrl}/exams`, { headers })
      const allExams = await examsRes.json()
      const teacherExams = allExams.filter((e: any) => e.teacherId === user?.teacherId)

      // Build student grades map
      const studentGradesMap = new Map<string, StudentGrade>()

      for (const exam of teacherExams) {
        if (exam.submissions && exam.submissions.length > 0) {
          for (const submission of exam.submissions) {
            const studentKey = submission.studentId
            const percentage = exam.totalMarks > 0 ? (submission.totalScore / exam.totalMarks) * 100 : 0
            const passed = submission.totalScore >= exam.passingMarks

            const examResult: ExamResult = {
              examId: exam.id,
              examTitle: exam.title,
              totalScore: submission.totalScore,
              totalMarks: exam.totalMarks,
              mcqScore: submission.mcqScore || 0,
              structuralScore: submission.structuralScore || 0,
              isGraded: submission.isGraded,
              submittedAt: submission.submittedAt,
              percentage,
              passed
            }

            if (!studentGradesMap.has(studentKey)) {
              studentGradesMap.set(studentKey, {
                studentId: submission.studentId,
                studentName: `${submission.student.firstName} ${submission.student.lastName}`,
                studentEmail: submission.student.email,
                className: exam.class.name,
                classId: exam.classId,
                exams: [],
                averageScore: 0,
                totalExams: 0,
                passedExams: 0
              })
            }

            const studentGrade = studentGradesMap.get(studentKey)!
            studentGrade.exams.push(examResult)
          }
        }
      }

      // Calculate averages and stats
      const gradesArray = Array.from(studentGradesMap.values()).map(sg => {
        const totalScore = sg.exams.reduce((sum, e) => sum + e.percentage, 0)
        sg.averageScore = sg.exams.length > 0 ? totalScore / sg.exams.length : 0
        sg.totalExams = sg.exams.length
        sg.passedExams = sg.exams.filter(e => e.passed).length
        return sg
      })

      setStudentGrades(gradesArray)

      // Calculate overall stats
      const totalStudents = gradesArray.length
      const averageClassScore = gradesArray.length > 0
        ? gradesArray.reduce((sum, sg) => sum + sg.averageScore, 0) / gradesArray.length
        : 0
      const totalExamsGraded = gradesArray.reduce((sum, sg) => sum + sg.totalExams, 0)
      const totalPassed = gradesArray.reduce((sum, sg) => sum + sg.passedExams, 0)
      const passRate = totalExamsGraded > 0 ? (totalPassed / totalExamsGraded) * 100 : 0

      setStats({
        totalStudents,
        averageClassScore: Math.round(averageClassScore * 10) / 10,
        totalExamsGraded,
        passRate: Math.round(passRate * 10) / 10
      })

    } catch (error) {
      console.error('Failed to fetch student grades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredGrades = selectedClass === "all"
    ? studentGrades
    : studentGrades.filter(sg => sg.classId === selectedClass)

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    if (percentage >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">With exam submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGradeColor(stats.averageClassScore)}`}>
              {stats.averageClassScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Exams Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalExamsGraded}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Students passing</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Filter by Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedClass === "all" ? "default" : "outline"}
              onClick={() => setSelectedClass("all")}
              size="sm"
            >
              All Classes
            </Button>
            {classes.map((cls) => (
              <Button
                key={cls.id}
                variant={selectedClass === cls.id ? "default" : "outline"}
                onClick={() => setSelectedClass(cls.id)}
                size="sm"
              >
                {cls.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Student Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No student grades found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGrades.map((studentGrade) => (
                <Card key={studentGrade.studentId} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{studentGrade.studentName}</h3>
                          <Badge variant="outline">{studentGrade.className}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{studentGrade.studentEmail}</p>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Average</p>
                            <p className={`font-bold ${getGradeColor(studentGrade.averageScore)}`}>
                              {studentGrade.averageScore.toFixed(1)}% ({getGradeLetter(studentGrade.averageScore)})
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Exams</p>
                            <p className="font-bold">{studentGrade.totalExams}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Passed</p>
                            <p className="font-bold text-green-600">{studentGrade.passedExams}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Failed</p>
                            <p className="font-bold text-red-600">{studentGrade.totalExams - studentGrade.passedExams}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Progress value={studentGrade.averageScore} className="h-2" />
                        </div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="ml-4">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{studentGrade.studentName} - Exam Results</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4 p-4">
                              {studentGrade.exams.map((exam) => (
                                <Card key={exam.examId}>
                                  <CardContent className="pt-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium mb-2">{exam.examTitle}</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <p className="text-muted-foreground">Score</p>
                                            <p className={`font-bold ${getGradeColor(exam.percentage)}`}>
                                              {exam.totalScore}/{exam.totalMarks} ({exam.percentage.toFixed(1)}%)
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">MCQ / Structural</p>
                                            <p className="font-medium">{exam.mcqScore} / {exam.structuralScore}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">Status</p>
                                            <Badge variant={exam.passed ? "default" : "destructive"}>
                                              {exam.passed ? "Passed" : "Failed"}
                                            </Badge>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">Submitted</p>
                                            <p className="text-sm">{new Date(exam.submittedAt).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

