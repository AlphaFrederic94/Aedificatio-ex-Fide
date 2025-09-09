"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function UpcomingAssignments() {
  const { getAuthHeaders } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const headers = getAuthHeaders()
        const response = await fetch('/api/assignments', { headers })
        if (response.ok) {
          const data = await response.json()
          setAssignments(data)
        }
      } catch (error) {
        console.error('Failed to fetch assignments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [getAuthHeaders])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upcoming Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading assignments...</div>
        </CardContent>
      </Card>
    )
  }

  const formatDueDate = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Overdue"
    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "Due tomorrow"
    if (diffDays <= 7) return `Due in ${diffDays} days`
    return due.toLocaleDateString()
  }

  const getPriority = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "overdue"
    if (diffDays <= 1) return "high"
    if (diffDays <= 3) return "medium"
    return "low"
  }

  const getStatus = (assignment: any) => {
    if (assignment.submissions && assignment.submissions.length > 0) {
      const submission = assignment.submissions[0]
      if (submission.grade !== null) return "graded"
      return "submitted"
    }
    return "not-started"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "overdue":
        return "bg-red-100 text-red-800 border-red-300"
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "graded":
        return "bg-green-50 text-green-700"
      case "submitted":
        return "bg-blue-50 text-blue-700"
      case "not-started":
        return "bg-gray-50 text-gray-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upcoming Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No assignments found. Check back later!
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment: any) => {
              const priority = getPriority(assignment.dueDate)
              const status = getStatus(assignment)
              const submission = assignment.submissions?.[0]

              return (
                <div key={assignment.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{assignment.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                        {status === "graded" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Graded
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{assignment.class?.name} - {assignment.class?.subject}</p>
                      <p className="text-sm mb-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDueDate(assignment.dueDate)}
                        </div>
                        <Badge variant="secondary" className={getStatusColor(status)}>
                          {status.replace("-", " ")}
                        </Badge>
                        {submission?.grade && (
                          <span className="text-sm font-medium">
                            Grade: {submission.grade}/{assignment.maxPoints}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {status === "not-started" && <Button size="sm">Start Work</Button>}
                      {status === "submitted" && <Button size="sm" variant="secondary" disabled>Submitted</Button>}
                      {status === "graded" && <Button size="sm" variant="outline">View Grade</Button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
