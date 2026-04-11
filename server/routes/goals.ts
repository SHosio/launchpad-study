import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { participant_id, initial_text, writing_start_at } = req.body

  // Test participants (id = -1) get a fake goal_id
  if (participant_id === -1) return res.json({ goal_id: -1 })

  const result = db.prepare(
    'INSERT INTO goals (participant_id, initial_text, goal_writing_start_at) VALUES (?, ?, ?)'
  ).run(participant_id, initial_text, writing_start_at)

  res.json({ goal_id: result.lastInsertRowid })
})

router.get('/by-participant/:participantId', (req, res) => {
  const goal = db.prepare(
    'SELECT id, initial_text, final_text FROM goals WHERE participant_id = ? ORDER BY id DESC LIMIT 1'
  ).get(req.params.participantId) as any

  if (!goal) return res.status(404).json({ error: 'No goal found' })
  res.json({ goal_text: goal.final_text || goal.initial_text })
})

router.post('/:id/finalize', (req, res) => {
  if (req.params.id === '-1') return res.json({ ok: true })

  const { final_text, exit_reason } = req.body

  db.prepare(`
    UPDATE goals
    SET final_text = ?, exit_reason = ?, goal_writing_end_at = datetime('now'),
        refinement_end_at = datetime('now')
    WHERE id = ?
  `).run(final_text, exit_reason || null, req.params.id)

  const count = db.prepare('SELECT COUNT(*) as c FROM refinement_rounds WHERE goal_id = ?').get(req.params.id) as any
  db.prepare('UPDATE goals SET total_rounds = ? WHERE id = ?').run(count.c, req.params.id)

  res.json({ ok: true })
})

export default router
