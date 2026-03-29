import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json())

const PORT = parseInt(process.env.PORT || '3001', 10)

// Import db to ensure schema is created
import './db.js'

// API routes
import participantsRouter from './routes/participants.js'
import surveysRouter from './routes/surveys.js'
import goalsRouter from './routes/goals.js'
import anchoringRouter from './routes/anchoring.js'
import aiRouter from './routes/ai.js'
import followupRouter from './routes/followup.js'
import adminRouter from './routes/admin.js'

app.use('/api/participants', participantsRouter)
app.use('/api/surveys', surveysRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/anchoring', anchoringRouter)
app.use('/api/ai', aiRouter)
app.use('/api/followup', followupRouter)
app.use('/api/admin', adminRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// In production, serve the Vite build
const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Study server running on port ${PORT}`)
})

export default app
