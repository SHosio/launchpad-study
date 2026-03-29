import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { participant_id, initial_text, writing_start_at } = req.body

  const result = db.prepare(
    'INSERT INTO goals (participant_id, initial_text, goal_writing_start_at) VALUES (?, ?, ?)'
  ).run(participant_id, initial_text, writing_start_at)

  res.json({ goal_id: result.lastInsertRowid })
})

router.post('/:id/finalize', (req, res) => {
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
