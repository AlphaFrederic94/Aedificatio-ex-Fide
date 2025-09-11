"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Clock, BookOpen, Users, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Class {
  id: string
  name: string
  subject: string
  grade: string
  teacher: {
    name: string
  }
  capacity: number
  status: string
  startDate: string
  endDate: string
  description: string
  _count: {
    enrolledStudents: number
  }
}

export function ClassApproval() {
  const { getAuthHeaders } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/classes', { headers })
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateClassStatus = async (classId: string, status: string) => {
    setUpdating(classId)
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`/api/classes/${classId}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchClasses() // Refresh the list
      } else {
        console.error('Failed to update class status')
      }
    } catch (error) {
      console.error('Failed to update class status:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-green-100 text-green-800", icon: Check },
      rejected: { color: "bg-red-100 text-red-800", icon: X },
      active: { color: "bg-blue-100 text-blue-800", icon: BookOpen },
      inactive: { color: "bg-gray-100 text-gray-800", icon: X }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const pendingClasses = classes.filter(c => c.status === 'pending')
  const otherClasses = classes.filter(c => c.status !== 'pending')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading classes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Class Approvals ({pendingClasses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingClasses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{classItem.name}</h3>
                        {getStatusBadge(classItem.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {classItem.subject} - Grade {classItem.grade}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Teacher: {classItem.teacher?.name || classItem.teacherName || 'Unknown Teacher'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Capacity: {classItem.capacity}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(classItem.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{classItem.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => updateClassStatus(classItem.id, 'approved')}
                        disabled={updating === classItem.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateClassStatus(classItem.id, 'rejected')}
                        disabled={updating === classItem.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherClasses.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{classItem.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {classItem.subject} - Grade {classItem.grade}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{classItem.teacher?.name || classItem.teacherName || 'Unknown Teacher'}</TableCell>
                  <TableCell>
                    {classItem._count?.enrolledStudents || 0}/{classItem.capacity}
                  </TableCell>
                  <TableCell>{getStatusBadge(classItem.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {classItem.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateClassStatus(classItem.id, 'active')}
                          disabled={updating === classItem.id}
                        >
                          Activate
                        </Button>
                      )}
                      {classItem.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateClassStatus(classItem.id, 'inactive')}
                          disabled={updating === classItem.id}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
