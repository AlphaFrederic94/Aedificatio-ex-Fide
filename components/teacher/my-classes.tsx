"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Clock, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { CreateClassDialog } from "./create-class-dialog"

interface ClassInfo {
  id: string
  name: string
  subject: string
  grade: string
  schedule: string
  room: string
  enrolledStudents: string[]
  capacity: number
  status: string
}

export function MyClasses() {
  const { user, getAuthHeaders } = useAuth()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const headers = getAuthHeaders()
        const response = await fetch("/api/classes", { headers })

        if (!response.ok) {
          throw new Error("Failed to fetch classes")
        }

        const allClasses = await response.json()
        const classesArray = Array.isArray(allClasses) ? allClasses : []

        // Filter classes for this teacher
        const teacherClasses = classesArray.filter((cls: any) => cls.teacherId === user?.teacherId)

        // Fetch enrollment count for each class
        const classesWithEnrollment = await Promise.all(
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
              return cls
            } catch (error) {
              console.error(`Failed to fetch enrollments for class ${cls.id}:`, error)
              return cls
            }
          })
        )

        setClasses(classesWithEnrollment)
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.teacherId) {
      fetchMyClasses()
    } else {
      setIsLoading(false)
    }
  }, [user, getAuthHeaders])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
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
            <BookOpen className="h-5 w-5" />
            My Classes
          </CardTitle>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Class
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No classes assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((classInfo) => (
              <div key={classInfo.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{classInfo.name}</h3>
                      <Badge variant={classInfo.status === "active" ? "default" : "secondary"}>
                        {classInfo.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {classInfo.subject}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {classInfo.enrolledStudents?.length || 0}/{classInfo.capacity}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {classInfo.schedule}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Room {classInfo.room}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/teacher/classes/${classInfo.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/teacher/attendance/${classInfo.id}`}>
                      <Button size="sm">Take Attendance</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateClassDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onClassCreated={() => {
            // Refresh classes list
            fetchClasses()
            setShowCreateDialog(false)
          }}
        />
      </CardContent>
    </Card>
  )
}
