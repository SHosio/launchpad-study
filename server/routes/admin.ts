import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db.js'

const router = Router()

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const password = req.headers['x-admin-password'] || req.query.password
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.get('/export', requireAdmin, (_req: Request, res: Response) => {
  const participants = db.prepare('SELECT * FROM participants').all()
  const surveys = db.prepare('SELECT * FROM survey_responses').all()
  const goals = db.prepare('SELECT * FROM goals').all()
  const rounds = db.prepare('SELECT * FROM refinement_rounds').all()
  const anchoringData = db.prepare('SELECT * FROM anchoring').all()
  const followups = db.prepare('SELECT * FROM followup_responses').all()

  res.json({
    exported_at: new Date().toISOString(),
    counts: {
      participants: participants.length,
      surveys: surveys.length,
      goals: goals.length,
      refinement_rounds: rounds.length,
      anchoring: anchoringData.length,
      followups: followups.length,
    },
    participants,
    surveys,
    goals,
    refinement_rounds: rounds,
    anchoring: anchoringData,
    followups,
  })
})

router.get('/stats', requireAdmin, (_req: Request, res: Response) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM participants').get() as any
  const completed = db.prepare("SELECT COUNT(*) as c FROM participants WHERE status = 'completed'").get() as any
  const byCondition = db.prepare('SELECT condition_a, condition_b, COUNT(*) as c FROM participants GROUP BY condition_a, condition_b').all()

  res.json({
    total: total.c,
    completed: completed.c,
    by_condition: byCondition,
  })
})

router.post('/reset', requireAdmin, (_req: Request, res: Response) => {
  const counts = {
    refinement_rounds: (db.prepare('SELECT COUNT(*) as c FROM refinement_rounds').get() as any).c,
    surveys: (db.prepare('SELECT COUNT(*) as c FROM survey_responses').get() as any).c,
    goals: (db.prepare('SELECT COUNT(*) as c FROM goals').get() as any).c,
    anchoring: (db.prepare('SELECT COUNT(*) as c FROM anchoring').get() as any).c,
    followups: (db.prepare('SELECT COUNT(*) as c FROM followup_responses').get() as any).c,
    participants: (db.prepare('SELECT COUNT(*) as c FROM participants').get() as any).c,
  }

  // Delete in FK order
  db.prepare('DELETE FROM refinement_rounds').run()
  db.prepare('DELETE FROM survey_responses').run()
  db.prepare('DELETE FROM anchoring').run()
  db.prepare('DELETE FROM followup_responses').run()
  db.prepare('DELETE FROM goals').run()
  db.prepare('DELETE FROM participants').run()

  res.json({ deleted: counts, reset_at: new Date().toISOString() })
})

export default router
