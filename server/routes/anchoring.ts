import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { participant_id, pleasure_vision, pain_vision } = req.body

  if (participant_id === -1) return res.json({ ok: true })

  db.prepare(
    'INSERT INTO anchoring (participant_id, pleasure_vision, pain_vision) VALUES (?, ?, ?)'
  ).run(participant_id, pleasure_vision, pain_vision)

  res.json({ ok: true })
})

export default router
