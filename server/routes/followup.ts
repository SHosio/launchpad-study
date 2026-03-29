import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { participant_id, responses } = req.body

  db.prepare(
    'INSERT INTO followup_responses (participant_id, goal_recall, goal_attainment, attainment_percentage, behavioral_specificity, structured_use, responses_json) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    participant_id,
    responses.goal_recall || null,
    responses.goal_achieved || null,
    responses.attainment_pct || null,
    responses.behavioral_specificity || null,
    responses.used_structured_approach || null,
    JSON.stringify(responses),
  )

  db.prepare("UPDATE participants SET status = 'followup_completed' WHERE id = ?").run(participant_id)

  res.json({ ok: true })
})

export default router
