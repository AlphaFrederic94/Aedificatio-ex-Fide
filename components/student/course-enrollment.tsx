"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Users, Clock, Calendar, Search, Filter, CheckCircle, AlertCircle, GraduationCap, MapPin } from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: string
  name: string
  subject: string
  grade: string
  teacherId: string
  teacherName: string
  room: string
  schedule: string
  startDate: string
  endDate: string
  description: string
  capacity: number
  enrolledCount: number
  status: string
  isEnrolled: boolean
}

export function CourseEnrollment() {
  const { user, getAuthHeaders } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [enrolledCourse, setEnrolledCourse] = useState<Course | null>(null)

  useEffect(() => {
    const fetchAvailableCourses = async () => {
      try {
        const headers = getAuthHeaders()
        
        // Fetch all classes and enrollments
        const [classesRes, enrollmentsRes, teachersRes] = await Promise.all([
          fetch("/api/classes", { headers }),
          fetch(`/api/enrollments/student/${user?.studentId}`, { headers }),
          fetch("/api/teachers", { headers })
        ])

        if (!classesRes.ok || !enrollmentsRes.ok || !teachersRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const [allClasses, enrollments, teachers] = await Promise.all([
          classesRes.json(),
          enrollmentsRes.json(),
          teachersRes.json()
        ])

        // Get enrolled class IDs
        const enrolledClassIds = new Set(enrollments.map((e: any) => e.classId))

        // Get enrollment counts for each class
        const enrollmentCountsRes = await fetch("/api/enrollments", { headers })
        const allEnrollments = enrollmentCountsRes.ok ? await enrollmentCountsRes.json() : []
        
        const enrollmentCounts = allEnrollments.reduce((acc: any, enrollment: any) => {
          acc[enrollment.classId] = (acc[enrollment.classId] || 0) + 1
          return acc
        }, {})

        // Build course list with enrollment status
        const coursesWithStatus = allClasses
          .filter((cls: any) => cls.status === 'active' || cls.status === 'approved')
          .map((cls: any) => {
            const teacher = teachers.find((t: any) => t.id === cls.teacherId)
            const enrolledCount = enrollmentCounts[cls.id] || 0
            
            return {
              id: cls.id,
              name: cls.name,
              subject: cls.subject,
              grade: cls.grade,
              teacherId: cls.teacherId,
              teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : cls.teacherName || "Unknown",
              room: cls.room,
              schedule: cls.schedule,
              startDate: cls.startDate,
              endDate: cls.endDate,
              description: cls.description || "",
              capacity: cls.capacity || 0,
              enrolledCount,
              status: cls.status,
              isEnrolled: enrolledClassIds.has(cls.id)
            }
          })

        setCourses(coursesWithStatus)
        setFilteredCourses(coursesWithStatus)
      } catch (error) {
        console.error("Failed to fetch courses:", error)
        toast.error("Failed to load available courses")
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.studentId) {
      fetchAvailableCourses()
    }
  }, [user, getAuthHeaders])

  useEffect(() => {
    let filtered = courses

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply grade filter
    if (gradeFilter !== "all") {
      filtered = filtered.filter(course => course.grade === gradeFilter)
    }

    // Apply subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter(course => course.subject === subjectFilter)
    }

    setFilteredCourses(filtered)
  }, [courses, searchTerm, gradeFilter, subjectFilter])

  const handleEnroll = async (courseId: string) => {
    if (!user?.studentId) return

    setEnrollingCourseId(courseId)
    try {
      const headers = getAuthHeaders()
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId: user.studentId,
          classId: courseId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to enroll in course")
      }

      // Update course enrollment status
      setCourses(prev => prev.map(course =>
        course.id === courseId
          ? { ...course, isEnrolled: true, enrolledCount: course.enrolledCount + 1 }
          : course
      ))

      // Find the enrolled course for success dialog
      const enrolledCourseData = courses.find(c => c.id === courseId)

      if (enrolledCourseData) {
        setEnrolledCourse(enrolledCourseData)
        setShowSuccessDialog(true)
      }

      toast.success("Successfully enrolled in course!")
    } catch (error: any) {
      console.error("Failed to enroll:", error)
      toast.error(error.message || "Failed to enroll in course")
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const getUniqueGrades = () => {
    const grades = [...new Set(courses.map(course => course.grade).filter(grade => grade && grade.trim() !== ''))].sort()
    return grades
  }

  const getUniqueSubjects = () => {
    const subjects = [...new Set(courses.map(course => course.subject).filter(subject => subject && subject.trim() !== ''))].sort()
    return subjects
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Available Courses
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Browse and enroll in approved courses available at your school
          </p>
          {filteredCourses.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {filteredCourses.filter(c => c.isEnrolled).length} enrolled
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-blue-600" />
                {filteredCourses.filter(c => !c.isEnrolled).length} available
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses, subjects, or teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {getUniqueGrades().map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {getUniqueSubjects().map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Course List */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-muted-foreground font-medium">No courses found matching your criteria</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Only courses approved for your school and grade level are shown here.
                Contact your administrator if you need access to additional courses.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{course.name}</h3>
                      <Badge variant="outline">{course.grade}</Badge>
                      <Badge variant="secondary">{course.subject}</Badge>
                      {course.isEnrolled && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enrolled
                        </Badge>
                      )}
                    </div>
                    
                    {course.description && (
                      <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.teacherName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.schedule}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Room {course.room}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrolledCount}/{course.capacity} enrolled
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>Start: {formatDate(course.startDate)}</span>
                      <span>End: {formatDate(course.endDate)}</span>
                    </div>
                  </div>

                  <div className="ml-4">
                    {course.isEnrolled ? (
                      <Button disabled variant="outline" className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Enrolled
                      </Button>
                    ) : course.enrolledCount >= course.capacity ? (
                      <Button disabled variant="outline" className="gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Full
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingCourseId === course.id}
                        className="gap-2"
                      >
                        {enrollingCourseId === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4" />
                            Enroll
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Success Enrollment Dialog */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-green-800">
              Enrollment Successful!
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            You have successfully enrolled in the following course:
          </DialogDescription>
        </DialogHeader>

        {enrolledCourse && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">{enrolledCourse.name}</h3>
                  <p className="text-sm text-gray-600">{enrolledCourse.subject} • Grade {enrolledCourse.grade}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Instructor: {enrolledCourse.teacherName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Room: {enrolledCourse.room}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Schedule: {enrolledCourse.schedule}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>What's next?</strong> You can now view this class in your schedule, access assignments, and participate in class activities.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowSuccessDialog(false)}
                className="flex-1"
              >
                Continue Browsing
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessDialog(false)
                  window.location.href = '/student/schedule'
                }}
                className="flex-1"
              >
                View Schedule
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
