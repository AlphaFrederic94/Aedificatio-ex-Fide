import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { prisma } from '../../infrastructure/prisma/client'
import { appendBlock } from '../audit/blockchain'

export const submissionsRouter = Router()

// List submissions (with filters)
submissionsRouter.get('/', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const { studentId, assignmentId, classId } = req.query
  const user = (req as any).user

  try {
    let whereClause: any = {}

    // Students can only see their own submissions
    if (user.role === 'student') {
      whereClause.studentId = user.studentId
    } else {
      // Teachers and admins can filter by studentId, assignmentId, or classId
      if (studentId) whereClause.studentId = studentId as string
      if (assignmentId) whereClause.assignmentId = assignmentId as string
      if (classId) {
        // Find assignments for this class first
        const assignments = await prisma.assignment.findMany({
          where: { classId: classId as string },
          select: { id: true }
        })
        whereClause.assignmentId = { in: assignments.map(a => a.id) }
      }
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            maxPoints: true,
            classId: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    res.json(submissions)
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

// Create a new submission
submissionsRouter.post('/', requireRole(['student']), async (req, res) => {
  const { assignmentId, content } = req.body
  const user = (req as any).user

  if (!assignmentId || !content) {
    return res.status(400).json({ error: 'Assignment ID and content are required' })
  }

  try {
    // Check if assignment exists
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.studentId,
        classId: assignment.classId
      }
    })

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this class' })
    }

    // Check if submission already exists
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: user.studentId
      }
    })

    if (existingSubmission) {
      return res.status(409).json({ error: 'Submission already exists for this assignment' })
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: user.studentId,
        content,
        submittedAt: new Date()
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            maxPoints: true
          }
        }
      }
    })

    await appendBlock({
      action: 'submission.create',
      actorId: user.id,
      entity: 'submission',
      entityId: submission.id,
      payload: { assignmentId, content: content.substring(0, 100) + '...' }
    })

    res.status(201).json(submission)
  } catch (error) {
    console.error('Failed to create submission:', error)
    res.status(500).json({ error: 'Failed to create submission' })
  }
})

// Get a specific submission
submissionsRouter.get('/:id', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const { id } = req.params
  const user = (req as any).user

  try {
    let whereClause: any = { id }

    // Students can only see their own submissions
    if (user.role === 'student') {
      whereClause.studentId = user.studentId
    }

    const submission = await prisma.submission.findFirst({
      where: whereClause,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            maxPoints: true,
            classId: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    res.json(submission)
  } catch (error) {
    console.error('Failed to fetch submission:', error)
    res.status(500).json({ error: 'Failed to fetch submission' })
  }
})

// Update submission (for grading)
submissionsRouter.patch('/:id', requireRole(['admin', 'teacher']), async (req, res) => {
  const { id } = req.params
  const { grade, feedback } = req.body
  const user = (req as any).user

  try {
    // Verify submission exists and teacher has access
    const submission = await prisma.submission.findFirst({
      where: { id },
      include: {
        assignment: {
          include: {
            class: true
          }
        }
      }
    })

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    // Teachers can only grade submissions for their classes
    if (user.role === 'teacher' && submission.assignment.class.teacherId !== user.teacherId) {
      return res.status(403).json({ error: 'Not authorized to grade this submission' })
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        ...(grade !== undefined && { grade: Number(grade) }),
        ...(feedback !== undefined && { feedback }),
        gradedAt: new Date()
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxPoints: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    await appendBlock({
      action: 'submission.grade',
      actorId: user.id,
      entity: 'submission',
      entityId: id,
      payload: { grade, feedback: feedback?.substring(0, 100) }
    })

    res.json(updatedSubmission)
  } catch (error) {
    console.error('Failed to update submission:', error)
    res.status(500).json({ error: 'Failed to update submission' })
  }
})
