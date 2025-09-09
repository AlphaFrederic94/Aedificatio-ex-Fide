import { Router } from 'express'
import { requireRole } from '../auth/middleware'
import { prisma } from '../../infrastructure/prisma/client'
import { appendBlock } from '../audit/blockchain'

export const messagesRouter = Router()

// List messages for current user
messagesRouter.get('/', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const userId = (req as any).user.id
  const { type = 'inbox' } = req.query

  try {
    let messages
    const baseWhere = { deletedAt: null }

    switch (type) {
      case 'sent':
        messages = await prisma.message.findMany({
          where: { ...baseWhere, senderId: userId },
          include: {
            recipient: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
        break
      case 'starred':
        messages = await prisma.message.findMany({
          where: { ...baseWhere, recipientId: userId, isStarred: true },
          include: {
            sender: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
        break
      case 'archived':
        messages = await prisma.message.findMany({
          where: { ...baseWhere, recipientId: userId, isArchived: true },
          include: {
            sender: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
        break
      default: // inbox - show both sent and received messages
        messages = await prisma.message.findMany({
          where: {
            ...baseWhere,
            OR: [
              { recipientId: userId, isArchived: false },
              { senderId: userId }
            ]
          },
          include: {
            sender: { select: { name: true, role: true } },
            recipient: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
    }

    res.json(messages)
  } catch (error) {
    console.error('messages list error', error)
    res.status(500).json({ error: 'Failed to load messages' })
  }
})

// Send message
messagesRouter.post('/', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const senderId = (req as any).user.id
  const { recipientId, subject, content } = req.body || {}

  if (!recipientId || !subject || !content) {
    return res.status(400).json({ error: 'recipientId, subject, and content are required' })
  }

  try {
    // Verify recipient exists and is in same school
    const sender = await prisma.user.findUnique({ where: { id: senderId } })
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } })

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' })
    }

    if (sender?.schoolId !== recipient.schoolId) {
      return res.status(403).json({ error: 'Can only message users in your school' })
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        subject,
        content
      },
      include: {
        recipient: { select: { name: true, role: true } }
      }
    })

    await appendBlock({ 
      action: 'message.send', 
      actorId: senderId, 
      entity: 'message', 
      entityId: message.id, 
      payload: { recipientId, subject } 
    })

    res.status(201).json(message)
  } catch (error) {
    console.error('message send error', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Get message details
messagesRouter.get('/:id', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const messageId = req.params.id
  const userId = (req as any).user.id

  try {
    const message = await prisma.message.findFirst({
      where: { 
        id: messageId, 
        deletedAt: null,
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      include: {
        sender: { select: { name: true, role: true } },
        recipient: { select: { name: true, role: true } }
      }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Mark as read if user is recipient
    if (message.recipientId === userId && !message.isRead) {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true }
      })
    }

    res.json(message)
  } catch (error) {
    console.error('message get error', error)
    res.status(500).json({ error: 'Failed to load message' })
  }
})

// Update message (star, archive, flag)
messagesRouter.patch('/:id', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const messageId = req.params.id
  const userId = (req as any).user.id
  const { isStarred, isArchived, flaggedToAdmin } = req.body || {}

  try {
    // Verify user can update this message (must be recipient)
    const message = await prisma.message.findFirst({
      where: { id: messageId, recipientId: userId, deletedAt: null }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    const updateData: any = {}
    if (typeof isStarred === 'boolean') updateData.isStarred = isStarred
    if (typeof isArchived === 'boolean') updateData.isArchived = isArchived
    if (typeof flaggedToAdmin === 'boolean') updateData.flaggedToAdmin = flaggedToAdmin

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: updateData
    })

    await appendBlock({ 
      action: 'message.update', 
      actorId: userId, 
      entity: 'message', 
      entityId: messageId, 
      payload: updateData 
    })

    res.json(updated)
  } catch (error) {
    console.error('message update error', error)
    res.status(500).json({ error: 'Failed to update message' })
  }
})

// Delete message
messagesRouter.delete('/:id', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const messageId = req.params.id
  const userId = (req as any).user.id

  try {
    // Verify user can delete this message (sender or recipient)
    const message = await prisma.message.findFirst({
      where: { 
        id: messageId, 
        deletedAt: null,
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() }
    })

    await appendBlock({ 
      action: 'message.delete', 
      actorId: userId, 
      entity: 'message', 
      entityId: messageId 
    })

    res.json({ message: 'Message deleted' })
  } catch (error) {
    console.error('message delete error', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

// Get users for messaging (same school)
messagesRouter.get('/users/contacts', requireRole(['admin', 'teacher', 'student']), async (req, res) => {
  const userId = (req as any).user.id
  const userRole = (req as any).user.role

  try {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!currentUser?.schoolId) {
      return res.status(400).json({ error: 'User must belong to a school' })
    }

    let users
    if (userRole === 'student') {
      // Students can message teachers and other students
      users = await prisma.user.findMany({
        where: {
          schoolId: currentUser.schoolId,
          id: { not: userId },
          role: { in: ['teacher', 'student'] }
        },
        select: {
          id: true,
          name: true,
          role: true,
          email: true
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }]
      })
    } else {
      // Teachers and admins can message everyone in school
      users = await prisma.user.findMany({
        where: {
          schoolId: currentUser.schoolId,
          id: { not: userId }
        },
        select: {
          id: true,
          name: true,
          role: true,
          email: true
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }]
      })
    }

    res.json(users)
  } catch (error) {
    console.error('contacts list error', error)
    res.status(500).json({ error: 'Failed to load contacts' })
  }
})

export default messagesRouter
