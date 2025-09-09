"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2 } from "lucide-react"
import { ClassForm } from "@/components/classes/class-form"
import { useAuth } from "@/contexts/auth-context"
import { useConfirmation } from "@/components/ui/confirmation-dialog"

export default function AdminSchedulePage() {
  const { getAuthHeaders } = useAuth()
  const { confirm, ConfirmationComponent } = useConfirmation()
  const [selectedWeek, setSelectedWeek] = useState("current")
  const [viewMode, setViewMode] = useState("week")
  const [showClassForm, setShowClassForm] = useState(false)
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders()
        const [classesRes, teachersRes, enrollmentsRes] = await Promise.all([
          fetch('/api/classes', { headers }),
          fetch('/api/teachers', { headers }),
          fetch('/api/enrollments', { headers })
        ])

        const [classesData, teachersData, enrollmentsData] = await Promise.all([
          classesRes.json(),
          teachersRes.json(),
          enrollmentsRes.json()
        ])

        setClasses(classesData)
        setTeachers(teachersData)
      } catch (error) {
        console.error('Failed to fetch schedule data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getAuthHeaders])

  const handleAddClass = () => {
    setShowClassForm(true)
  }

  const handleClassFormClose = () => {
    setShowClassForm(false)
    // Refresh data
    const fetchData = async () => {
      const headers = getAuthHeaders()
      const classesRes = await fetch('/api/classes', { headers })
      const classesData = await classesRes.json()
      setClasses(classesData)
    }
    fetchData()
  }

  const handleDeleteClass = (classId: string, className: string) => {
    confirm({
      title: "Delete Class",
      description: `Are you sure you want to delete "${className}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const headers = getAuthHeaders()
          await fetch(`/api/classes/${classId}`, { method: 'DELETE', headers })
          handleClassFormClose() // Refresh data
        } catch (error) {
          console.error('Failed to delete class:', error)
        }
      }
    })
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading schedule...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">School Schedule</h1>
            <p className="text-muted-foreground">Manage and view school-wide class schedules</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
                <SelectItem value="previous">Previous Week</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="day">Day View</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddClass}>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
        </div>

        {/* Schedule Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Total classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">Total teachers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Room Utilization</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">Average usage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schedule Conflicts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">3</div>
              <p className="text-xs text-muted-foreground">Need resolution</p>
            </CardContent>
          </Card>
        </div>

        {/* Classes List */}
        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
            <CardDescription>Manage school classes and schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls: any) => {
                const teacher = teachers.find((t: any) => t.id === cls.teacherId)
                return (
                  <div key={cls.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{cls.name}</h3>
                      <Badge variant="outline">{cls.subject}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Teacher: {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned'}</div>
                      <div>Room: {cls.room}</div>
                      <div>Schedule: {cls.schedule}</div>
                      <div>Capacity: {cls.capacity} students</div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Class Form Modal */}
        {showClassForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <ClassForm onClose={handleClassFormClose} />
            </div>
          </div>
        )}

        <ConfirmationComponent />
      </div>
    </AdminLayout>
  )
}
