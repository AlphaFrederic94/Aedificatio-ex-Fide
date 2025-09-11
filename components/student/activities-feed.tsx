'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, FileText, Clock, Calendar, BookOpen, CheckCircle, AlertCircle, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface Activity {
  id: string
  type: 'exam' | 'assignment' | 'grade' | 'announcement'
  title: string
  description: string
  className: string
  subject: string
  dueDate?: string
  duration?: number
  marks?: number
  grade?: number
  status: 'new' | 'in_progress' | 'completed' | 'overdue'
  createdAt: string
  isRead: boolean
}

interface Exam {
  id: string
  title: string
  description: string
  duration: number
  totalMarks: number
  startDate: string
  endDate: string
  class: {
    name: string
    subject: string
  }
  submissions: any[]
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  totalMarks: number
  class: {
    name: string
    subject: string
  }
  submissions: any[]
}

export default function ActivitiesFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'pending' | 'completed'>('all')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      
      // Fetch exams, assignments, and grades in parallel
      const [examsRes, assignmentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/exams/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/assignments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const [examsData, assignmentsData] = await Promise.all([
        examsRes.ok ? examsRes.json() : [],
        assignmentsRes.ok ? assignmentsRes.json() : []
      ])

      setExams(examsData)
      setAssignments(assignmentsData)

      // Convert to activities
      const examActivities: Activity[] = examsData.map((exam: Exam) => {
        const hasSubmission = exam.submissions.length > 0
        const isActive = new Date() >= new Date(exam.startDate) && new Date() <= new Date(exam.endDate)
        const isOverdue = new Date() > new Date(exam.endDate)
        
        let status: Activity['status'] = 'new'
        if (hasSubmission) status = 'completed'
        else if (isOverdue) status = 'overdue'
        else if (isActive) status = 'in_progress'

        return {
          id: exam.id,
          type: 'exam',
          title: exam.title,
          description: exam.description || `Exam for ${exam.class.subject}`,
          className: exam.class.name,
          subject: exam.class.subject,
          dueDate: exam.endDate,
          duration: exam.duration,
          marks: exam.totalMarks,
          status,
          createdAt: exam.startDate,
          isRead: hasSubmission
        }
      })

      const assignmentActivities: Activity[] = assignmentsData.map((assignment: Assignment) => {
        const hasSubmission = assignment.submissions.length > 0
        const isOverdue = new Date() > new Date(assignment.dueDate)
        
        let status: Activity['status'] = 'new'
        if (hasSubmission) status = 'completed'
        else if (isOverdue) status = 'overdue'

        return {
          id: assignment.id,
          type: 'assignment',
          title: assignment.title,
          description: assignment.description || `Assignment for ${assignment.class.subject}`,
          className: assignment.class.name,
          subject: assignment.class.subject,
          dueDate: assignment.dueDate,
          marks: assignment.totalMarks,
          status,
          createdAt: assignment.dueDate,
          isRead: hasSubmission
        }
      })

      const allActivities = [...examActivities, ...assignmentActivities]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setActivities(allActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to fetch activities')
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredActivities = () => {
    switch (filter) {
      case 'new':
        return activities.filter(a => a.status === 'new' || a.status === 'in_progress')
      case 'pending':
        return activities.filter(a => a.status === 'new' || a.status === 'in_progress' || a.status === 'overdue')
      case 'completed':
        return activities.filter(a => a.status === 'completed')
      default:
        return activities
    }
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'exam':
        return <FileText className="h-4 w-4" />
      case 'assignment':
        return <BookOpen className="h-4 w-4" />
      case 'grade':
        return <Trophy className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: Activity['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>
      case 'in_progress':
        return <Badge className="bg-orange-500">Active</Badge>
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    
    return date.toLocaleDateString()
  }

  const getNewActivitiesCount = () => {
    return activities.filter(a => !a.isRead && (a.status === 'new' || a.status === 'in_progress')).length
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activities
          </CardTitle>
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

  const filteredActivities = getFilteredActivities()
  const newCount = getNewActivitiesCount()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activities
            {newCount > 0 && (
              <Badge className="bg-red-500 text-white">{newCount}</Badge>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('new')}
            >
              New
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities found for the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className={`border-l-4 ${
                activity.type === 'exam' ? 'border-l-blue-500' : 
                activity.type === 'assignment' ? 'border-l-green-500' : 
                'border-l-purple-500'
              } ${!activity.isRead ? 'bg-blue-50/50' : ''}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getActivityIcon(activity.type)}
                        <h3 className="font-semibold">{activity.title}</h3>
                        {getStatusBadge(activity.status)}
                        {!activity.isRead && (
                          <Badge variant="outline" className="text-blue-600">
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.className} - {activity.subject}
                      </p>
                      
                      <p className="text-sm mb-3">{activity.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {activity.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(activity.dueDate)}
                          </div>
                        )}
                        
                        {activity.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.duration} minutes
                          </div>
                        )}
                        
                        {activity.marks && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {activity.marks} marks
                          </div>
                        )}
                      </div>
                      
                      {activity.status === 'overdue' && (
                        <div className="flex items-center gap-1 text-red-600 text-xs mt-2">
                          <AlertCircle className="h-3 w-3" />
                          This {activity.type} is overdue
                        </div>
                      )}
                      
                      {activity.status === 'in_progress' && activity.type === 'exam' && (
                        <div className="flex items-center gap-1 text-orange-600 text-xs mt-2">
                          <Clock className="h-3 w-3" />
                          Exam is currently active - you can take it now!
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {activity.status === 'completed' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Completed</span>
                        </div>
                      )}
                      
                      {activity.status === 'in_progress' && activity.type === 'exam' && (
                        <Button size="sm" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Take Exam
                        </Button>
                      )}
                      
                      {activity.status === 'new' && activity.type === 'assignment' && (
                        <Button size="sm" variant="outline" className="gap-1">
                          <BookOpen className="h-3 w-3" />
                          View Assignment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
