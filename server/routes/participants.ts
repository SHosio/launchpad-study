import { Router } from 'express'
import db from '../db.js'

const router = Router()

const CONDITIONS = [
  { a: 'A1', b: 'B1' },
  { a: 'A2', b: 'B1' },
  { a: 'A1', b: 'B2' },
  { a: 'A2', b: 'B2' },
]

// Timeout for considering a participant "active" (45 minutes)
const ACTIVE_TIMEOUT_MINUTES = 45

/**
 * Balanced random assignment: pick the cell with fewest active participants.
 * "Active" = completed OR started within the last 45 minutes (still plausible).
 * Abandoned sessions (started > 45 min ago, not completed) don't hold a slot.
 */
function assignCondition(): { a: string; b: string } {
  const cutoff = new Date(Date.now() - ACTIVE_TIMEOUT_MINUTES * 60000).toISOString().replace('T', ' ').slice(0, 19)

  const counts = CONDITIONS.map(c => {
    const row = db.prepare(
      `SELECT COUNT(*) as n FROM participants
       WHERE condition_a = ? AND condition_b = ?
       AND (status = 'completed' OR session_start_at > ?)`
    ).get(c.a, c.b, cutoff) as any
    return { ...c, n: row.n as number }
  })

  // Find the minimum count, then randomly pick among cells tied at that minimum
  const minCount = Math.min(...counts.map(c => c.n))
  const candidates = counts.filter(c => c.n === minCount)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

router.post('/', (req, res) => {
  const { prolific_pid, study_id, session_id, condition_a, condition_b } = req.body

  if (!prolific_pid) {
    return res.status(400).json({ error: 'Missing prolific_pid' })
  }

  const isTest = prolific_pid.startsWith('test_') || prolific_pid.startsWith('test')

  // Use provided conditions (from v param) or auto-assign
  let condA = condition_a
  let condB = condition_b
  if (!condA || !condB) {
    const assigned = assignCondition()
    condA = assigned.a
    condB = assigned.b
  }

  // Test PIDs get a fake participant object without touching the database
  if (isTest) {
    return res.json({
      id: -1,
      prolific_pid,
      study_id: study_id || null,
      session_id: session_id || null,
      condition_a: condA,
      condition_b: condB,
      status: 'started',
      demographics_json: null,
      session_start_at: new Date().toISOString(),
      session_end_at: null,
    })
  }

  // Return existing participant if they already started
  const existing = db.prepare('SELECT * FROM participants WHERE prolific_pid = ?').get(prolific_pid) as any
  if (existing) {
    return res.json(existing)
  }

  const result = db.prepare(
    'INSERT INTO participants (prolific_pid, study_id, session_id, condition_a, condition_b) VALUES (?, ?, ?, ?, ?)'
  ).run(prolific_pid, study_id || null, session_id || null, condA, condB)

  const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(result.lastInsertRowid)
  res.json(participant)
})

router.get('/:prolific_pid', (req, res) => {
  const participant = db.prepare('SELECT * FROM participants WHERE prolific_pid = ?').get(req.params.prolific_pid)
  if (!participant) return res.status(404).json({ error: 'Participant not found' })
  res.json(participant)
})

router.post('/:id/status', (req, res) => {
  if (req.params.id === '-1') return res.json({ ok: true })
  const { status } = req.body
  const updates = status === 'completed'
    ? "status = ?, session_end_at = datetime('now')"
    : 'status = ?'
  db.prepare(`UPDATE participants SET ${updates} WHERE id = ?`).run(status, req.params.id)
  res.json({ ok: true })
})

router.post('/:id/demographics', (req, res) => {
  if (req.params.id === '-1') return res.json({ ok: true })
  const { demographics } = req.body
  db.prepare('UPDATE participants SET demographics_json = ? WHERE id = ?').run(JSON.stringify(demographics), req.params.id)
  res.json({ ok: true })
})

export default router
