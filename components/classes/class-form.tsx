"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, BookOpen, Users } from "lucide-react"
import type { Class, CreateClassData } from "@/types/class"
import type { Teacher } from "@/types/teacher"
import type { Student } from "@/types/student"

interface ClassFormProps {
  class?: Class | null
  onClose: () => void
}

export function ClassForm({ class: classData, onClose }: ClassFormProps) {
  const [formData, setFormData] = useState<CreateClassData>({
    name: "",
    subject: "",
    grade: "",
    teacherId: "",
    room: "",
    schedule: "",
    capacity: 20,
    description: "",
    startDate: "",
    endDate: "",
  })
  const [status, setStatus] = useState<"active" | "inactive" | "completed">("active")
  const [enrolledStudents, setEnrolledStudents] = useState<string[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toDateInput = (val?: string) => {
    if (!val) return ""
    try {
      return new Date(val).toISOString().slice(0, 10)
    } catch {
      return (val || "").slice(0, 10)
    }
  }

  useEffect(() => {
    fetchTeachers()
    fetchStudents()
    if (classData) {
      setFormData({
        name: classData.name,
        subject: classData.subject,
        grade: classData.grade,
        teacherId: classData.teacherId,
        room: classData.room,
        schedule: classData.schedule,
        capacity: classData.capacity,
        description: classData.description,
        startDate: toDateInput(classData.startDate),
        endDate: toDateInput(classData.endDate),
      })
      setStatus(classData.status)
      setEnrolledStudents(classData.enrolledStudents ?? [])
    }
  }, [classData])

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teachers")
      const data = await response.json()
      setTeachers(data.filter((t: Teacher) => !t.deletedAt && t.status === "active"))
    } catch (error) {
      console.error("Failed to fetch teachers:", error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students")
      const data = await response.json()
      setStudents(data.filter((s: Student) => !s.deletedAt && s.status === "active"))
    } catch (error) {
      console.error("Failed to fetch students:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = classData ? `/api/classes/${classData.id}` : "/api/classes"
      const method = classData ? "PUT" : "POST"
      const body = classData ? { ...formData, status, enrolledStudents } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        onClose()
      } else {
        const errorData = await response.json()
        setErrors(errorData.errors || { general: "Failed to save class" })
      }
    } catch (error) {
      setErrors({ general: "An error occurred while saving the class" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateClassData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    if (checked) {
      if (enrolledStudents.length < formData.capacity) {
        setEnrolledStudents((prev) => [...prev, studentId])
      }
    } else {
      setEnrolledStudents((prev) => prev.filter((id) => id !== studentId))
    }
  }

  const getSelectedTeacher = () => {
    return teachers.find((t) => t.id === formData.teacherId)
  }

  const getStudentsByGrade = () => {
    if (!formData.grade) return students
    return students.filter((s) => s.grade === formData.grade)
  }

  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Physical Education",
    "Art",
    "Music",
    "Computer Science",
    "Foreign Languages",
    "Social Studies",
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{classData ? "Edit Class" : "Add New Class"}</CardTitle>
              <CardDescription>
                {classData ? "Update class information" : "Create a new class and assign teacher and students"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Advanced Algebra"
                  required
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={formData.grade} onValueChange={(value) => handleInputChange("grade", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherId">Teacher</Label>
                <Select value={formData.teacherId} onValueChange={(value) => handleInputChange("teacherId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} - {teacher.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teacherId && <p className="text-sm text-destructive">{errors.teacherId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => handleInputChange("room", e.target.value)}
                  placeholder="e.g., Math-101"
                  required
                />
                {errors.room && <p className="text-sm text-destructive">{errors.room}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", Number.parseInt(e.target.value) || 20)}
                  required
                />
                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
              </div>
              {classData && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value: "active" | "inactive" | "completed") => setStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => handleInputChange("schedule", e.target.value)}
                placeholder="e.g., Mon, Wed, Fri - 9:00 AM"
                required
              />
              {errors.schedule && <p className="text-sm text-destructive">{errors.schedule}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  required
                />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  required
                />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of the class content and objectives"
                required
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            {formData.grade && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-semibold">
                    Enroll Students ({enrolledStudents.length}/{formData.capacity})
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-md p-4">
                  {getStudentsByGrade().map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={enrolledStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleStudentToggle(student.id, checked as boolean)}
                        disabled={
                          !enrolledStudents.includes(student.id) && enrolledStudents.length >= formData.capacity
                        }
                      />
                      <Label htmlFor={`student-${student.id}`} className="text-sm font-normal cursor-pointer">
                        {student.firstName} {student.lastName}
                      </Label>
                    </div>
                  ))}
                  {getStudentsByGrade().length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                      No students available for Grade {formData.grade}
                    </p>
                  )}
                </div>
              </div>
            )}

            {errors.general && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{errors.general}</div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : classData ? "Update Class" : "Create Class"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
