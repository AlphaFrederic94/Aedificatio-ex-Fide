"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Users } from "lucide-react"
import type { Teacher } from "@/types/teacher"
import { TeacherForm } from "./teacher-form"
import { useAuth } from "@/contexts/auth-context"

export function TeacherList() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const { getAuthHeaders } = useAuth()

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    filterTeachers()
  }, [teachers, searchTerm, departmentFilter, statusFilter])

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teachers", {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        console.error("Failed to fetch teachers:", response.status, response.statusText)
        setTeachers([])
        return
      }

      const data = await response.json()
      console.log("[v0] Teachers API response:", data)

      if (Array.isArray(data)) {
        setTeachers(data)
      } else {
        console.error("[v0] Teachers data is not an array:", data)
        setTeachers([])
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  const filterTeachers = () => {
    if (!Array.isArray(teachers)) {
      console.error("[v0] Teachers is not an array in filterTeachers:", teachers)
      setFilteredTeachers([])
      return
    }

    let filtered = teachers.filter((teacher) => !teacher.deletedAt)

    if (searchTerm) {
      filtered = filtered.filter(
        (teacher) =>
          teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((teacher) => teacher.department === departmentFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((teacher) => teacher.status === statusFilter)
    }

    setFilteredTeachers(filtered)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      try {
        await fetch(`/api/teachers/${id}`, { method: "DELETE" })
        fetchTeachers()
      } catch (error) {
        console.error("Failed to delete teacher:", error)
      }
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTeacher(null)
    fetchTeachers()
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 hover:bg-green-100",
      inactive: "bg-red-100 text-red-800 hover:bg-red-100",
      "on-leave": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  const getDepartments = () => {
    if (!Array.isArray(teachers)) {
      console.error("[v0] Teachers is not an array in getDepartments:", teachers)
      return []
    }

    const departments = Array.from(new Set(teachers.map((t) => t.department).filter(dept => dept && dept.trim() !== '')))
    return departments.sort()
  }

  if (showForm) {
    return <TeacherForm teacher={editingTeacher} onClose={handleFormClose} />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Teachers</CardTitle>
                <CardDescription>Manage teacher records and information</CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Teacher
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getDepartments().map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
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
                <SelectItem value="on-leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading teachers...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No teachers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.department}</TableCell>
                        <TableCell>{teacher.subject}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(teacher.status)}>
                            {teacher.status === "on-leave" ? "On Leave" : teacher.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{teacher.experience} years</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(teacher)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(teacher.id)}
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
    </div>
  )
}
