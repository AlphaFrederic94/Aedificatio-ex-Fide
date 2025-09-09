"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, BookOpen, Users } from "lucide-react"
import type { Class } from "@/types/class"
import { ClassForm } from "./class-form"
import { useAuth } from "@/contexts/auth-context"
import { useConfirmation } from "@/components/ui/confirmation-dialog"

export function ClassList() {
  const { getAuthHeaders } = useAuth()
  const { confirm, ConfirmationComponent } = useConfirmation()
  const [classes, setClasses] = useState<Class[]>([])
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    filterClasses()
  }, [classes, searchTerm, gradeFilter, statusFilter, subjectFilter])

  // Optional: derive enrolled counts by querying enrollments
  const deriveEnrolledCounts = async (list: Class[]) => {
    try {
      const res = await fetch('/api/enrollments', { headers: getAuthHeaders?.() || {} as any })
      if (!res.ok) return list
      const enrollments = await res.json()
      const byClass = new Map<string, number>()
      for (const e of enrollments) byClass.set(e.classId, (byClass.get(e.classId) || 0) + 1)
      return list.map(c => ({ ...c, enrolledStudents: Array.from({ length: byClass.get(c.id) || 0 }, (_, i) => `${i}`) as any }))
    } catch {
      return list
    }
  }

  const fetchClasses = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch("/api/classes", { headers })
      const data = await response.json()
      // Derive enrolled counts from enrollments
      const enrichedData = await deriveEnrolledCounts(data)
      setClasses(enrichedData)
    } catch (error) {
      console.error("Failed to fetch classes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterClasses = () => {
    let filtered = classes.filter((cls) => !cls.deletedAt)

    if (searchTerm) {
      filtered = filtered.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.room.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (gradeFilter !== "all") {
      filtered = filtered.filter((cls) => cls.grade === gradeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((cls) => cls.status === statusFilter)
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter((cls) => cls.subject === subjectFilter)
    }

    setFilteredClasses(filtered)
  }

  const handleDelete = async (id: string, className: string) => {
    confirm({
      title: "Delete Class",
      description: `Are you sure you want to delete "${className}"? This action cannot be undone and will remove all associated enrollments.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const headers = getAuthHeaders()
          await fetch(`/api/classes/${id}`, { method: "DELETE", headers })
          fetchClasses()
        } catch (error) {
          console.error("Failed to delete class:", error)
        }
      }
    })
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingClass(null)
    fetchClasses()
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 hover:bg-green-100",
      inactive: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  const getSubjects = () => {
    const subjects = Array.from(new Set(classes.map((c) => c.subject)))
    return subjects.sort()
  }

  if (showForm) {
    return <ClassForm class={editingClass} onClose={handleFormClose} />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Classes</CardTitle>
                <CardDescription>Manage class schedules and enrollments</CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {getSubjects().map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading classes...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No classes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClasses.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.subject}</TableCell>
                        <TableCell>Grade {cls.grade}</TableCell>
                        <TableCell>{cls.teacherName}</TableCell>
                        <TableCell>{cls.room}</TableCell>
                        <TableCell className="text-sm">{cls.schedule}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {(cls.enrolledStudents?.length ?? 0)}/{cls.capacity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(cls.status)}>{cls.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(cls)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cls.id, cls.name)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmationComponent />
    </div>
  )
}
