import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { participant_id, survey_type, responses } = req.body

  if (!participant_id || !survey_type || !responses) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Test participants (id = -1) skip DB writes
  if (participant_id === -1) return res.json({ ok: true })

  db.prepare(
    'INSERT INTO survey_responses (participant_id, survey_type, responses_json) VALUES (?, ?, ?)'
  ).run(participant_id, survey_type, JSON.stringify(responses))

  res.json({ ok: true })
})

export default router
