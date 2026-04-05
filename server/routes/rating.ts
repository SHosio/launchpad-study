import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

const BATCH_SIZE = 8
const RATERS_PER_BATCH = 5

/**
 * Seed batches from completed goals. Run once via /api/rating/seed?password=xxx
 * Creates randomized batches of 8 goals mixing initial (A2 only) and final texts.
 * Constraint: no batch contains both initial and final from the same participant.
 * Raters are blind to which version they're rating.
 */
router.post('/seed', (req: Request, res: Response) => {
  const password = req.query.password || req.headers['x-admin-password']
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check if batches already exist
  const existing = (db.prepare('SELECT COUNT(*) as c FROM rating_batches').get() as any).c
  if (existing > 0) {
    return res.status(400).json({ error: 'Batches already exist. Reset first if you want to re-seed.' })
  }

  // Get completed participants and their goals
  const goals = db.prepare(`
    SELECT g.id as goal_id, g.participant_id, g.initial_text, g.final_text, p.condition_a
    FROM goals g
    JOIN participants p ON g.participant_id = p.id
    WHERE p.status = 'completed'
    ORDER BY g.id
  `).all() as any[]

  // Deduplicate: take last goal per participant
  const byParticipant = new Map<number, any>()
  for (const g of goals) {
    byParticipant.set(g.participant_id, g)
  }

  // Build rating items: final for everyone, initial for A2 only
  const items: { goal_id: number; participant_id: number; version: string; text: string }[] = []

  for (const g of byParticipant.values()) {
    const finalText = g.final_text || g.initial_text
    if (finalText?.trim()) {
      items.push({ goal_id: g.goal_id, participant_id: g.participant_id, version: 'final', text: finalText })
    }
    // Initial text only for A2 (coached) participants — enables within-person comparison
    if (g.condition_a === 'A2' && g.initial_text?.trim()) {
      items.push({ goal_id: g.goal_id, participant_id: g.participant_id, version: 'initial', text: g.initial_text })
    }
  }

  // Shuffle (Fisher-Yates)
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }

  // Assign to batches with constraint: no batch has both versions from same participant
  const batches: typeof items[] = [[]]
  const batchParticipants: Set<number>[] = [new Set()]

  for (const item of items) {
    let placed = false
    for (let b = 0; b < batches.length; b++) {
      if (batches[b].length < BATCH_SIZE && !batchParticipants[b].has(item.participant_id)) {
        batches[b].push(item)
        batchParticipants[b].add(item.participant_id)
        placed = true
        break
      }
    }
    if (!placed) {
      batches.push([item])
      batchParticipants.push(new Set([item.participant_id]))
    }
  }

  // Write to DB
  const insert = db.prepare('INSERT INTO rating_batches (batch_number, goal_id, goal_version, display_order, goal_text) VALUES (?, ?, ?, ?, ?)')
  for (let b = 0; b < batches.length; b++) {
    for (let i = 0; i < batches[b].length; i++) {
      const item = batches[b][i]
      insert.run(b + 1, item.goal_id, item.version, i + 1, item.text)
    }
  }

  const initialCount = items.filter(i => i.version === 'initial').length
  const finalCount = items.filter(i => i.version === 'final').length

  res.json({
    seeded: true,
    total_goals: items.length,
    initial_goals: initialCount,
    final_goals: finalCount,
    total_batches: batches.length,
    goals_per_batch: BATCH_SIZE,
    raters_per_batch: RATERS_PER_BATCH,
    total_rater_slots: batches.length * RATERS_PER_BATCH,
  })
})

/**
 * Rating page — serves the full rating UI
 */
router.get('/', (req: Request, res: Response) => {
  const prolificPid = (req.query.PROLIFIC_PID || req.query.prolific_pid || '') as string

  if (!prolificPid) {
    return res.type('html').send(errorPage('Missing PROLIFIC_PID parameter.'))
  }

  // Check if this rater already completed
  const existingRater = db.prepare('SELECT * FROM rating_raters WHERE prolific_pid = ?').get(prolificPid) as any
  if (existingRater?.completed) {
    return res.type('html').send(thankYouPage())
  }

  // Find or assign batch
  let batchNumber: number
  if (existingRater) {
    batchNumber = existingRater.batch_number
  } else {
    // Find batch with fewest raters, under the cap
    const batchCounts = db.prepare(`
      SELECT b.batch_number, COUNT(r.id) as rater_count
      FROM (SELECT DISTINCT batch_number FROM rating_batches) b
      LEFT JOIN rating_raters r ON r.batch_number = b.batch_number
      GROUP BY b.batch_number
      HAVING rater_count < ?
      ORDER BY rater_count ASC, b.batch_number ASC
      LIMIT 1
    `).get(RATERS_PER_BATCH) as any

    if (!batchCounts) {
      return res.type('html').send(errorPage('All rating slots are currently full. Thank you for your interest.'))
    }

    batchNumber = batchCounts.batch_number
    db.prepare('INSERT INTO rating_raters (prolific_pid, batch_number) VALUES (?, ?)').run(prolificPid, batchNumber)
  }

  // Get goals for this batch, randomize order for this rater
  const goals = db.prepare('SELECT * FROM rating_batches WHERE batch_number = ? ORDER BY display_order').all(batchNumber) as any[]

  // Shuffle for this rater (different order than the stored display_order)
  for (let i = goals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[goals[i], goals[j]] = [goals[j], goals[i]]
  }

  res.type('html').send(ratingPage(goals, prolificPid, batchNumber))
})

/**
 * Submit ratings
 */
router.post('/submit', (req: Request, res: Response) => {
  const { prolific_pid, batch_number, ratings } = req.body

  if (!prolific_pid || !batch_number || !ratings || !Array.isArray(ratings)) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const rater = db.prepare('SELECT * FROM rating_raters WHERE prolific_pid = ?').get(prolific_pid) as any
  if (!rater) {
    return res.status(400).json({ error: 'Rater not found' })
  }
  if (rater.completed) {
    return res.status(400).json({ error: 'Already completed' })
  }

  const insert = db.prepare(`
    INSERT INTO goal_ratings (rater_id, batch_number, goal_id, goal_version,
      rating_specific, rating_measurable, rating_achievable, rating_relevant, rating_timebound, rating_holistic)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const r of ratings) {
    insert.run(rater.id, batch_number, r.goal_id, r.goal_version,
      r.specific, r.measurable, r.achievable, r.relevant, r.timebound, r.holistic)
  }

  db.prepare('UPDATE rating_raters SET completed = 1 WHERE id = ?').run(rater.id)

  res.json({ ok: true })
})

/**
 * Status endpoint
 */
router.get('/status', (req: Request, res: Response) => {
  const password = req.query.password || req.headers['x-admin-password']
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const batches = db.prepare(`
    SELECT b.batch_number, b.goal_version, COUNT(DISTINCT b.goal_id) as goals,
      (SELECT COUNT(*) FROM rating_raters r WHERE r.batch_number = b.batch_number AND r.completed = 1) as completed_raters,
      (SELECT COUNT(*) FROM rating_raters r WHERE r.batch_number = b.batch_number) as total_raters
    FROM rating_batches b
    GROUP BY b.batch_number, b.goal_version
    ORDER BY b.batch_number
  `).all()

  const totalRatings = (db.prepare('SELECT COUNT(*) as c FROM goal_ratings').get() as any).c

  res.json({ batches, total_ratings: totalRatings })
})

/**
 * Reset all rating data
 */
router.post('/reset', (req: Request, res: Response) => {
  const password = req.query.password || req.headers['x-admin-password']
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const ratings = (db.prepare('SELECT COUNT(*) as c FROM goal_ratings').get() as any).c
  const raters = (db.prepare('SELECT COUNT(*) as c FROM rating_raters').get() as any).c
  const batches = (db.prepare('SELECT COUNT(*) as c FROM rating_batches').get() as any).c

  db.prepare('DELETE FROM goal_ratings').run()
  db.prepare('DELETE FROM rating_raters').run()
  db.prepare('DELETE FROM rating_batches').run()

  res.json({ deleted: { ratings, raters, batches } })
})

// --- HTML Templates ---

function errorPage(message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Goal Rating</title>
<style>body{font-family:-apple-system,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem;color:#18181b;}h1{font-size:1.3rem;}</style>
</head><body><h1>Unable to Continue</h1><p>${message}</p></body></html>`
}

function thankYouPage(): string {
  const completionCode = 'RATE_COMPLETE_2026'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Thank You</title>
<style>body{font-family:-apple-system,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem;color:#18181b;text-align:center;}
h1{font-size:1.5rem;margin-top:3rem;}a{display:inline-block;margin-top:1rem;padding:0.75rem 2rem;background:#f97316;color:white;border-radius:0.5rem;text-decoration:none;font-weight:600;}</style>
</head><body><h1>Thank You!</h1><p>Your ratings have been recorded.</p>
<a href="https://app.prolific.com/submissions/complete?cc=${completionCode}">Return to Prolific</a>
</body></html>`
}

function ratingPage(goals: any[], prolificPid: string, batchNumber: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Goal Quality Rating</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #fff; color: #18181b; max-width: 700px; margin: 0 auto; padding: 2rem 1rem; line-height: 1.6; }
  h1 { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; }
  .subtitle { color: #71717a; font-size: 0.85rem; margin-bottom: 2rem; }
  .instructions { background: #f9fafb; border: 1px solid #e4e4e7; border-radius: 0.5rem; padding: 1rem 1.25rem; margin-bottom: 2rem; font-size: 0.85rem; }
  .instructions h2 { font-size: 0.95rem; margin-bottom: 0.5rem; }
  .instructions p { margin-bottom: 0.5rem; color: #3f3f46; }
  .rubric { font-size: 0.75rem; color: #52525b; margin-top: 0.75rem; }
  .rubric table { width: 100%; border-collapse: collapse; margin-top: 0.25rem; }
  .rubric th, .rubric td { padding: 0.25rem 0.5rem; border: 1px solid #e4e4e7; text-align: left; }
  .rubric th { background: #f4f4f5; font-weight: 600; }
  .goal-card { border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; display: none; }
  .goal-card.active { display: block; }
  .goal-text { background: #f9fafb; border-left: 3px solid #f97316; padding: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem; line-height: 1.7; white-space: pre-wrap; }
  .dimension { margin-bottom: 1rem; }
  .dimension label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; }
  .dimension .hint { font-size: 0.72rem; color: #71717a; margin-bottom: 0.4rem; }
  .scale { display: flex; gap: 0; }
  .scale label { flex: 1; text-align: center; padding: 0.4rem 0.2rem; border: 1px solid #e4e4e7; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; }
  .scale label:first-child { border-radius: 0.375rem 0 0 0.375rem; }
  .scale label:last-child { border-radius: 0 0.375rem 0.375rem 0; }
  .scale label:hover { background: #fff7ed; }
  .scale input { display: none; }
  .scale input:checked + span { background: #f97316; color: white; }
  .scale label:has(input:checked) { background: #f97316; color: white; border-color: #ea580c; }
  .progress { font-size: 0.8rem; color: #71717a; margin-bottom: 1rem; }
  .nav { display: flex; gap: 0.75rem; margin-top: 1rem; }
  .nav button { padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; transition: all 0.15s; }
  .btn-next { background: #f97316; color: white; }
  .btn-next:hover { background: #ea580c; }
  .btn-next:disabled { background: #d4d4d8; cursor: not-allowed; }
  .btn-back { background: #f4f4f5; color: #3f3f46; }
  .btn-back:hover { background: #e4e4e7; }
  .btn-submit { background: #22c55e; color: white; }
  .btn-submit:hover { background: #16a34a; }
  .btn-submit:disabled { background: #d4d4d8; cursor: not-allowed; }
  hr { border: none; border-top: 1px solid #e4e4e7; margin: 0.75rem 0; }
</style>
</head><body>

<div id="intro">
  <h1>Goal Quality Rating</h1>
  <p class="subtitle">You will rate ${goals.length} goal statements written by real people.</p>

  <div class="instructions">
    <h2>Instructions</h2>
    <p>Each person was asked to write a professional or personal development goal they want to achieve in the next 4-5 weeks. For each goal, please rate it on 6 dimensions using the scales provided.</p>
    <p>Read each goal carefully. Rate based on <strong>what is written</strong>, not what you think the person might have meant. There are no right or wrong answers.</p>
    <p><strong>Rate each dimension independently.</strong> A goal can be strong on one dimension and weak on another.</p>

    <div class="rubric">
      <table>
        <tr><th>Scale</th><th>1 (Weak)</th><th>3 (Adequate)</th><th>5 (Strong)</th></tr>
        <tr><td><strong>Specific</strong></td><td>Vague, generic</td><td>Names an action but could be more precise</td><td>Precise, verifiable deliverable</td></tr>
        <tr><td><strong>Measurable</strong></td><td>No way to tell when done</td><td>General completion state</td><td>Clear done/not-done criterion</td></tr>
        <tr><td><strong>Achievable</strong></td><td>Too ambitious or trivially easy</td><td>Plausible but hard to judge</td><td>Clearly realistic stretch</td></tr>
        <tr><td><strong>Relevant</strong></td><td>No personal connection</td><td>Implies relevance</td><td>Explicitly states why it matters</td></tr>
        <tr><td><strong>Time-Bound</strong></td><td>No deadline</td><td>Vague timeframe</td><td>Specific date or deadline</td></tr>
        <tr><td><strong>Overall</strong></td><td>Vague, unfocused</td><td>Clear action, reasonable timeframe</td><td>Precise, grounded commitment</td></tr>
      </table>
    </div>
  </div>

  <button class="btn-next" onclick="startRating()">Begin Rating</button>
</div>

<div id="rating-area" style="display:none;">
  <p class="progress" id="progress"></p>

  ${goals.map((g, i) => `
  <div class="goal-card" id="goal-${i}" data-goal-id="${g.goal_id}" data-goal-version="${g.goal_version}">
    <div class="goal-text">${escapeHtml(g.goal_text)}</div>

    ${renderDimension(i, 'specific', 'Specific', 'Does it name a clear, precise deliverable?')}
    ${renderDimension(i, 'measurable', 'Measurable', 'Can you tell exactly when it is done?')}
    ${renderDimension(i, 'achievable', 'Achievable', 'Is it realistic for 4-5 weeks?')}
    ${renderDimension(i, 'relevant', 'Relevant', 'Does it say why this matters to them?')}
    ${renderDimension(i, 'timebound', 'Time-Bound', 'Is there a specific deadline?')}
    <hr>
    ${renderDimension(i, 'holistic', 'Overall Quality', 'How good is this goal overall?')}

    <div class="nav">
      ${i > 0 ? '<button class="btn-back" onclick="showGoal(' + (i - 1) + ')">Back</button>' : ''}
      ${i < goals.length - 1
        ? `<button class="btn-next" id="next-${i}" onclick="showGoal(${i + 1})" disabled>Next</button>`
        : `<button class="btn-submit" id="submit-btn" onclick="submitRatings()" disabled>Submit All Ratings</button>`
      }
    </div>
  </div>
  `).join('')}
</div>

<div id="submitting" style="display:none;text-align:center;padding:3rem;">
  <p>Submitting your ratings...</p>
</div>

<script>
const TOTAL = ${goals.length};
let current = 0;

function startRating() {
  document.getElementById('intro').style.display = 'none';
  document.getElementById('rating-area').style.display = 'block';
  showGoal(0);
}

function showGoal(idx) {
  current = idx;
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('active'));
  document.getElementById('goal-' + idx).classList.add('active');
  document.getElementById('progress').textContent = 'Goal ' + (idx + 1) + ' of ' + TOTAL;
  window.scrollTo(0, 0);
}

// Enable next/submit when all 6 dimensions rated for current goal
document.querySelectorAll('input[type=radio]').forEach(input => {
  input.addEventListener('change', () => {
    const goalIdx = parseInt(input.name.split('_')[0].replace('g', ''));
    checkComplete(goalIdx);
  });
});

function checkComplete(goalIdx) {
  const dims = ['specific', 'measurable', 'achievable', 'relevant', 'timebound', 'holistic'];
  const allRated = dims.every(d => document.querySelector('input[name="g' + goalIdx + '_' + d + '"]:checked'));
  const nextBtn = document.getElementById('next-' + goalIdx) || document.getElementById('submit-btn');
  if (nextBtn) nextBtn.disabled = !allRated;
}

function submitRatings() {
  const ratings = [];
  for (let i = 0; i < TOTAL; i++) {
    const card = document.getElementById('goal-' + i);
    const goalId = parseInt(card.dataset.goalId);
    const goalVersion = card.dataset.goalVersion;
    const dims = ['specific', 'measurable', 'achievable', 'relevant', 'timebound', 'holistic'];
    const r = { goal_id: goalId, goal_version: goalVersion };
    for (const d of dims) {
      const checked = document.querySelector('input[name="g' + i + '_' + d + '"]:checked');
      r[d] = checked ? parseInt(checked.value) : null;
    }
    ratings.push(r);
  }

  document.getElementById('rating-area').style.display = 'none';
  document.getElementById('submitting').style.display = 'block';

  fetch('/api/rating/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prolific_pid: '${prolificPid}',
      batch_number: ${batchNumber},
      ratings: ratings
    })
  }).then(r => r.json()).then(data => {
    if (data.ok) {
      window.location.href = '/rate/done';
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
      document.getElementById('rating-area').style.display = 'block';
      document.getElementById('submitting').style.display = 'none';
    }
  }).catch(err => {
    alert('Network error. Please try again.');
    document.getElementById('rating-area').style.display = 'block';
    document.getElementById('submitting').style.display = 'none';
  });
}
</script>
</body></html>`
}

function renderDimension(goalIdx: number, dimKey: string, label: string, hint: string): string {
  const name = `g${goalIdx}_${dimKey}`
  return `
    <div class="dimension">
      <label>${label}</label>
      <div class="hint">${hint}</div>
      <div class="scale">
        ${[1,2,3,4,5].map(v => `<label><input type="radio" name="${name}" value="${v}"><span>${v}${v === 1 ? ' Weak' : v === 5 ? ' Strong' : ''}</span></label>`).join('')}
      </div>
    </div>`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>')
}

// Done page
router.get('/done', (_req: Request, res: Response) => {
  res.type('html').send(thankYouPage())
})

export default router
