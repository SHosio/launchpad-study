import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { prolific_pid, study_id, session_id, condition_a, condition_b } = req.body

  if (!prolific_pid || !condition_a || !condition_b) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const existing = db.prepare('SELECT * FROM participants WHERE prolific_pid = ?').get(prolific_pid) as any
  if (existing) {
    return res.json(existing)
  }

  const result = db.prepare(
    'INSERT INTO participants (prolific_pid, study_id, session_id, condition_a, condition_b) VALUES (?, ?, ?, ?, ?)'
  ).run(prolific_pid, study_id || null, session_id || null, condition_a, condition_b)

  const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(result.lastInsertRowid)
  res.json(participant)
})

router.get('/:prolific_pid', (req, res) => {
  const participant = db.prepare('SELECT * FROM participants WHERE prolific_pid = ?').get(req.params.prolific_pid)
  if (!participant) return res.status(404).json({ error: 'Participant not found' })
  res.json(participant)
})

router.post('/:id/status', (req, res) => {
  const { status } = req.body
  const updates = status === 'completed'
    ? "status = ?, session_end_at = datetime('now')"
    : 'status = ?'
  db.prepare(`UPDATE participants SET ${updates} WHERE id = ?`).run(status, req.params.id)
  res.json({ ok: true })
})

router.post('/:id/demographics', (req, res) => {
  const { demographics } = req.body
  db.prepare('UPDATE participants SET demographics_json = ? WHERE id = ?').run(JSON.stringify(demographics), req.params.id)
  res.json({ ok: true })
})

export default router
