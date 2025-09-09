"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, X } from "lucide-react"

interface AssignmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classId?: string
}

interface ClassOption {
  id: string
  name: string
  subject: string
  grade: string
}

export function AssignmentForm({ isOpen, onClose, onSuccess, classId }: AssignmentFormProps) {
  const { user, getAuthHeaders } = useAuth()
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: classId || "",
    dueDate: "",
    maxPoints: "100"
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchClasses()
      // Reset form when opening
      setFormData({
        title: "",
        description: "",
        classId: classId || "",
        dueDate: "",
        maxPoints: "100"
      })
      setErrors({})
    }
  }, [isOpen, classId])

  const fetchClasses = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/classes', { headers })
      if (response.ok) {
        const data = await response.json()
        const teacherClasses = data.filter((cls: any) => cls.teacherId === user?.teacherId)
        setClasses(teacherClasses)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.classId) {
      newErrors.classId = "Class is required"
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required"
    } else {
      const dueDate = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        newErrors.dueDate = "Due date cannot be in the past"
      }
    }

    const maxPoints = parseInt(formData.maxPoints)
    if (isNaN(maxPoints) || maxPoints < 1 || maxPoints > 1000) {
      newErrors.maxPoints = "Max points must be between 1 and 1000"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          classId: formData.classId,
          dueDate: formData.dueDate,
          maxPoints: parseInt(formData.maxPoints)
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setErrors({ general: errorData.error || 'Failed to create assignment' })
      }
    } catch (error) {
      console.error('Failed to create assignment:', error)
      setErrors({ general: 'Failed to create assignment. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create New Assignment
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignment Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter assignment title..."
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            {/* Class Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class *</label>
              <Select
                value={formData.classId}
                onValueChange={(value) => handleInputChange('classId', value)}
              >
                <SelectTrigger className={errors.classId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject} (Grade {cls.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId && <p className="text-sm text-red-500">{errors.classId}</p>}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date *</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                min={getMinDate()}
                className={errors.dueDate ? "border-red-500" : ""}
              />
              {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
            </div>

            {/* Max Points */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Points *</label>
              <Input
                type="number"
                value={formData.maxPoints}
                onChange={(e) => handleInputChange('maxPoints', e.target.value)}
                placeholder="100"
                min="1"
                max="1000"
                className={errors.maxPoints ? "border-red-500" : ""}
              />
              {errors.maxPoints && <p className="text-sm text-red-500">{errors.maxPoints}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter assignment description and instructions..."
                rows={4}
              />
            </div>
          </div>

          {errors.general && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
