import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { prisma } from '../../infrastructure/prisma/client'
import { appendBlock } from '../audit/blockchain'

export const assignmentsRouter = Router()

// List assignments for current user
assignmentsRouter.get('/', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const schoolId = (req as any).user.schoolId
  const userRole = (req as any).user.role
  const userId = (req as any).user.id

  try {
    let assignments
    if (userRole === 'student') {
      // Students see assignments from their enrolled classes
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { classId: true }
      })
      const classIds = enrollments.map(e => e.classId)

      assignments = await prisma.assignment.findMany({
        where: {
          classId: { in: classIds },
          deletedAt: null
        },
        include: {
          class: { select: { name: true, subject: true } },
          submissions: {
            where: { studentId: userId },
            select: { id: true, submittedAt: true, grade: true, feedback: true }
          }
        },
        orderBy: { dueDate: 'asc' }
      })
    } else {
      // Admin/teachers see assignments in their school
      const where: any = { deletedAt: null }
      if (schoolId) where.class = { schoolId }
      if (userRole === 'teacher') where.teacherId = userId

      assignments = await prisma.assignment.findMany({
        where,
        include: {
          class: { select: { name: true, subject: true } },
          _count: { select: { submissions: true } }
        },
        orderBy: { dueDate: 'asc' }
      })
    }

    res.json(assignments)
  } catch (error) {
    console.error('assignments list error', error)
    res.status(500).json({ error: 'Failed to load assignments' })
  }
})

// Create assignment (teachers only)
assignmentsRouter.post('/', requireRole(['teacher']), async (req, res) => {
  const { title, description, classId, dueDate, maxPoints } = req.body || {}
  const user = (req as any).user
  const teacherId = user.teacherId // Use teacherId from JWT token, not user.id

  if (!title || !classId || !dueDate) {
    return res.status(400).json({ error: 'title, classId, and dueDate are required' })
  }

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher profile not found' })
  }

  try {
    // Verify teacher owns the class
    const classData = await prisma.class.findFirst({
      where: { id: classId, teacherId, deletedAt: null }
    })
    if (!classData) {
      return res.status(403).json({ error: 'You can only create assignments for your own classes' })
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || '',
        classId,
        teacherId,
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100
      }
    })

    await appendBlock({
      action: 'assignment.create',
      actorId: user.id, // Use user.id for audit log
      entity: 'assignment',
      entityId: assignment.id,
      payload: { title, classId, dueDate }
    })

    res.status(201).json(assignment)
  } catch (error) {
    console.error('assignment create error', error)
    res.status(500).json({ error: 'Failed to create assignment' })
  }
})

// Get assignment details
assignmentsRouter.get('/:id', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const assignmentId = req.params.id
  const userId = (req as any).user.id
  const userRole = (req as any).user.role

  try {
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        class: { select: { name: true, subject: true } },
        submissions: userRole === 'student'
          ? { where: { studentId: userId } }
          : { include: { student: { select: { firstName: true, lastName: true } } } }
      }
    })

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    // Check access permissions
    if (userRole === 'student') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: userId, classId: assignment.classId }
      })
      if (!enrollment) {
        return res.status(403).json({ error: 'You are not enrolled in this class' })
      }
    } else if (userRole === 'teacher' && assignment.teacherId !== userId) {
      return res.status(403).json({ error: 'You can only view your own assignments' })
    }

    res.json(assignment)
  } catch (error) {
    console.error('assignment get error', error)
    res.status(500).json({ error: 'Failed to load assignment' })
  }
})

// Submit assignment (students only)
assignmentsRouter.post('/:id/submit', requireRole(['student']), async (req, res) => {
  const assignmentId = req.params.id
  const studentId = (req as any).user.id
  const { content, attachments } = req.body || {}

  if (!content) {
    return res.status(400).json({ error: 'content is required' })
  }

  try {
    // Verify student is enrolled in the class
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null }
    })
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, classId: assignment.classId }
    })
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this class' })
    }

    // Check if already submitted
    const existing = await prisma.submission.findFirst({
      where: { assignmentId, studentId }
    })
    if (existing) {
      return res.status(409).json({ error: 'Assignment already submitted' })
    }

    // Check if past due date
    if (new Date() > assignment.dueDate) {
      return res.status(400).json({ error: 'Assignment is past due date' })
    }

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        content,
        attachments: attachments || []
      }
    })

    await appendBlock({
      action: 'assignment.submit',
      actorId: studentId,
      entity: 'submission',
      entityId: submission.id,
      payload: { assignmentId }
    })

    res.status(201).json(submission)
  } catch (error) {
    console.error('assignment submit error', error)
    res.status(500).json({ error: 'Failed to submit assignment' })
  }
})

// Grade submission (teachers only)
assignmentsRouter.put('/:id/submissions/:submissionId/grade', requireRole(['teacher']), async (req, res) => {
  const { id: assignmentId, submissionId } = req.params
  const teacherId = (req as any).user.id
  const { grade, feedback } = req.body || {}

  if (grade === undefined) {
    return res.status(400).json({ error: 'grade is required' })
  }

  try {
    // Verify teacher owns the assignment
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId, deletedAt: null }
    })
    if (!assignment) {
      return res.status(403).json({ error: 'You can only grade your own assignments' })
    }

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: parseFloat(grade),
        feedback: feedback || '',
        gradedAt: new Date()
      }
    })

    await appendBlock({
      action: 'assignment.grade',
      actorId: teacherId,
      entity: 'submission',
      entityId: submission.id,
      payload: { grade, feedback }
    })

    res.json(submission)
  } catch (error) {
    console.error('assignment grade error', error)
    res.status(500).json({ error: 'Failed to grade submission' })
  }
})

// Get assignments for a specific class
assignmentsRouter.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params

    const assignments = await prisma.assignment.findMany({
      where: { classId },
      include: {
        submissions: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    // Add submission count and total students for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const totalStudents = await prisma.enrollment.count({
          where: { classId }
        })

        return {
          ...assignment,
          submissionCount: assignment.submissions.length,
          totalStudents
        }
      })
    )

    res.json(assignmentsWithStats)
  } catch (error) {
    console.error('Error fetching class assignments:', error)
    res.status(500).json({ error: 'Failed to fetch assignments' })
  }
})

// Grade a submission
assignmentsRouter.post('/:submissionId/grade', requireRole(['teacher']), async (req, res) => {
  try {
    const { submissionId } = req.params
    const { grade, feedback } = req.body

    if (grade === undefined || grade === null) {
      return res.status(400).json({ error: 'Grade is required' })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: { maxPoints: true }
        }
      }
    })

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    if (grade < 0 || grade > submission.assignment.maxPoints) {
      return res.status(400).json({
        error: `Grade must be between 0 and ${submission.assignment.maxPoints}`
      })
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: parseFloat(grade),
        feedback: feedback || null,
        gradedAt: new Date()
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true }
        },
        assignment: {
          select: { title: true, maxPoints: true }
        }
      }
    })

    res.json(updatedSubmission)
  } catch (error) {
    console.error('Error grading submission:', error)
    res.status(500).json({ error: 'Failed to grade submission' })
  }
})

export default assignmentsRouter