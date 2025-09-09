import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pino from 'pino'
import { appRouter } from './routes'

const app = express()
const logger = pino()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', appRouter)

const port = process.env.PORT || 4000
app.listen(port, () => logger.info({ msg: `Server listening on port ${port}` }))

