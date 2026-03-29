import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { participant_id, ...responses } = req.body

  db.prepare(
    'INSERT INTO followup_responses (participant_id, recall_confidence, recall_recognition, goal_attainment, attainment_percentage, responses_json) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    participant_id,
    responses.recall_confidence || null,
    responses.recall_recognition || null,
    responses.goal_achieved || null,
    responses.attainment_pct || null,
    JSON.stringify(responses),
  )

  db.prepare("UPDATE participants SET status = 'followup_completed' WHERE id = ?").run(participant_id)

  res.json({ ok: true })
})

export default router
