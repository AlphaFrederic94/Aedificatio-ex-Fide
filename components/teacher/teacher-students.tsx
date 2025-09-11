"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, Mail, Phone, Calendar, BookOpen } from "lucide-react"

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  grade: string
  parentName: string
  parentEmail: string
  parentPhone: string
  enrollmentDate: string
  status: string
}

interface ClassInfo {
  id: string
  name: string
  subject: string
  grade: string
  enrolledStudents: string[]
}

export function TeacherStudents() {
  const { user, getAuthHeaders } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders()
        
        // Fetch teacher's classes
        const classesResponse = await fetch("/api/classes", { headers })
        if (classesResponse.ok) {
          const allClasses = await classesResponse.json()
          const classesArray = Array.isArray(allClasses) ? allClasses : []
          const teacherClasses = classesArray.filter((cls: any) => cls.teacherId === user?.teacherId)
          
          // Fetch enrollment data for each class
          const classesWithEnrollments = await Promise.all(
            teacherClasses.map(async (cls) => {
              try {
                const enrollmentRes = await fetch(`/api/enrollments?classId=${cls.id}`, { headers })
                if (enrollmentRes.ok) {
                  const enrollments = await enrollmentRes.json()
                  return {
                    ...cls,
                    enrolledStudents: enrollments.map((e: any) => e.studentId)
                  }
                }
                return { ...cls, enrolledStudents: [] }
              } catch (error) {
                console.error(`Failed to fetch enrollments for class ${cls.id}:`, error)
                return { ...cls, enrolledStudents: [] }
              }
            })
          )
          
          setClasses(classesWithEnrollments)
          
          // Get all unique student IDs from all classes
          const allStudentIds = [...new Set(classesWithEnrollments.flatMap(cls => cls.enrolledStudents))]
          
          // Fetch student details
          const studentsData = await Promise.all(
            allStudentIds.map(async (studentId) => {
              try {
                const studentRes = await fetch(`/api/students/${studentId}`, { headers })
                if (studentRes.ok) {
                  return await studentRes.json()
                }
                return null
              } catch (error) {
                console.error(`Failed to fetch student ${studentId}:`, error)
                return null
              }
            })
          )
          
          const validStudents = studentsData.filter(student => student !== null)
          setStudents(validStudents)
        }
      } catch (error) {
        console.error("Failed to fetch students data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.teacherId) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [user, getAuthHeaders])

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedClass === "all") return matchesSearch
    
    const selectedClassData = classes.find(cls => cls.id === selectedClass)
    const isInSelectedClass = selectedClassData?.enrolledStudents.includes(student.id)
    
    return matchesSearch && isInSelectedClass
  })

  const getStudentClasses = (studentId: string) => {
    return classes.filter(cls => cls.enrolledStudents.includes(studentId))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading students...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Students ({filteredStudents.length})
          </CardTitle>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {students.length === 0 ? "No students enrolled in your classes yet." : "No students match your search criteria."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const studentClasses = getStudentClasses(student.id)
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Grade {student.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {studentClasses.map(cls => (
                          <div key={cls.id} className="flex items-center gap-1 text-sm">
                            <BookOpen className="h-3 w-3" />
                            {cls.subject}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{student.parentName}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {student.parentEmail}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {student.parentPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
