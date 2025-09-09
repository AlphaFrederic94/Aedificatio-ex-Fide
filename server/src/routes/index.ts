import { Router } from 'express'

export const appRouter = Router()

import { authRouter } from '../modules/auth/routes'

appRouter.use('/auth', authRouter)
import { studentsRouter } from '../modules/students/routes'
import { teachersRouter } from '../modules/teachers/routes'
import { classesRouter } from '../modules/classes/routes'
import { signupRouter } from '../modules/signup/routes'
appRouter.use('/signup', signupRouter)
import { auditRouter } from '../modules/audit/routes'
appRouter.use('/audit', auditRouter)
import { enrollmentsRouter } from '../modules/enrollments/routes'
appRouter.use('/enrollments', enrollmentsRouter)
import { attendanceRouter } from '../modules/attendance/routes'
appRouter.use('/attendance', attendanceRouter)
import { assignmentsRouter } from '../modules/assignments/routes'
appRouter.use('/assignments', assignmentsRouter)
import { messagesRouter } from '../modules/messages/routes'
appRouter.use('/messages', messagesRouter)



appRouter.use('/students', studentsRouter)
appRouter.use('/teachers', teachersRouter)
appRouter.use('/classes', classesRouter)


appRouter.get('/', (_req, res) => res.json({ message: 'API root' }))

