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

interface Participant {
  id: number
  prolific_pid: string
  condition_a: string
  condition_b: string
  status: string
  demographics_json: string | null
  session_start_at: string | null
  session_end_at: string | null
}

interface SurveyRow {
  participant_id: number
  survey_type: string
  responses_json: string
}

interface GoalRow {
  id: number
  participant_id: number
  initial_text: string
  final_text: string | null
  total_rounds: number
  exit_reason: string | null
  goal_writing_start_at: string | null
  goal_writing_end_at: string | null
  refinement_start_at: string | null
  refinement_end_at: string | null
}

interface RoundRow {
  goal_id: number
  round_number: number
  goal_text: string
  ai_overall: string
  ai_dimensions_json: string
  flagged_dimension: string | null
  submitted_at: string
}

// --- Helpers ---

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function sd(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1))
}

function fmt(n: number): string {
  return n.toFixed(2)
}

function reverseKGC(val: number): number {
  return 6 - val // 5-point scale: 1→5, 2→4, etc.
}

function kgcComposite(data: Record<string, unknown>): number | null {
  const prefix = data.kgc_1 !== undefined ? 'kgc_' : 'kgc_post_'
  const raw = [1, 2, 3, 4, 5].map(i => Number(data[`${prefix}${i}`]))
  if (raw.some(isNaN)) return null
  // Reverse-code items 1, 2, 4
  const scored = [reverseKGC(raw[0]), reverseKGC(raw[1]), raw[2], reverseKGC(raw[3]), raw[4]]
  return mean(scored)
}

function cellLabel(a: string, b: string): string {
  const labels: Record<string, string> = {
    'A1_B1': 'Control',
    'A2_B1': 'AI Only',
    'A1_B2': 'Anchoring Only',
    'A2_B2': 'AI+Anchoring',
  }
  return labels[`${a}_${b}`] || `${a}×${b}`
}

function attentionPassed(data: Record<string, unknown>): boolean {
  const ac1 = Number(data.attention_check_1)
  const ac2 = Number(data.attention_check_2)
  // Pass if at least one is correct (value 4 = Somewhat Agree)
  return ac1 === 4 || ac2 === 4
}

function sessionMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return ms / 60000
}

function wordCount(text: unknown): number {
  if (!text || typeof text !== 'string') return 0
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// --- Dashboard ---

router.get('/dash', requireAdmin, (_req: Request, res: Response) => {
  const participants = db.prepare('SELECT * FROM participants').all() as Participant[]
  const surveys = db.prepare('SELECT * FROM survey_responses').all() as SurveyRow[]
  const goals = db.prepare('SELECT * FROM goals').all() as GoalRow[]
  const rounds = db.prepare('SELECT * FROM refinement_rounds').all() as RoundRow[]

  // Group surveys by participant — take the LAST pre and post for each
  const preSurveys = new Map<number, Record<string, unknown>>()
  const postSurveys = new Map<number, Record<string, unknown>>()
  for (const s of surveys) {
    try {
      const data = JSON.parse(s.responses_json)
      if (s.survey_type === 'pre_measure') preSurveys.set(s.participant_id, data)
      if (s.survey_type === 'post_measure') postSurveys.set(s.participant_id, data)
    } catch { /* skip malformed survey records */ }
  }

  // Group goals by participant (take last)
  const participantGoals = new Map<number, GoalRow>()
  for (const g of goals) {
    participantGoals.set(g.participant_id, g)
  }

  // Group rounds by goal
  const goalRounds = new Map<number, RoundRow[]>()
  for (const r of rounds) {
    if (!goalRounds.has(r.goal_id)) goalRounds.set(r.goal_id, [])
    goalRounds.get(r.goal_id)!.push(r)
  }

  const cells = ['A1_B1', 'A2_B1', 'A1_B2', 'A2_B2']

  // --- 1. Recruitment ---
  const statuses = ['demographics', 'goal_readiness_gate', 'pre_measure', 'priming', 'priming_compliance', 'goal_writing', 'coaching', 'anchoring', 'post_measure', 'completed']
  const recruitmentRows = cells.map(cell => {
    const [a, b] = cell.split('_')
    const ps = participants.filter(p => p.condition_a === a && p.condition_b === b)
    const statusCounts: Record<string, number> = {}
    for (const s of statuses) statusCounts[s] = ps.filter(p => p.status === s).length
    return { cell, a, b, total: ps.length, completed: statusCounts['completed'] || 0, statusCounts }
  })

  // --- 2. Self-efficacy by condition ---
  type CellData = { pre_se: number[], post_se: number[], pre_kgc: number[], post_kgc: number[], post_clarity: number[], post_readiness: number[], pre_energy: number[], post_energy: number[], process_help: number[], process_frust: number[], session_mins: number[], attn_pass: number, attn_total: number }
  const cellData: Record<string, CellData> = {}
  for (const cell of cells) {
    cellData[cell] = { pre_se: [], post_se: [], pre_kgc: [], post_kgc: [], post_clarity: [], post_readiness: [], pre_energy: [], post_energy: [], process_help: [], process_frust: [], session_mins: [], attn_pass: 0, attn_total: 0 }
  }

  for (const p of participants) {
    const cell = `${p.condition_a}_${p.condition_b}`
    const cd = cellData[cell]
    if (!cd) continue

    const pre = preSurveys.get(p.id)
    const post = postSurveys.get(p.id)

    if (pre) {
      const se = Number(pre.goal_self_efficacy)
      if (!isNaN(se)) cd.pre_se.push(se)
      const kgc = kgcComposite(pre)
      if (kgc !== null) cd.pre_kgc.push(kgc)
      const energy = Number(pre.baseline_energy)
      if (!isNaN(energy)) cd.pre_energy.push(energy)
    }

    if (post) {
      const se = Number(post.post_goal_self_efficacy)
      if (!isNaN(se)) cd.post_se.push(se)
      const kgc = kgcComposite(post)
      if (kgc !== null) cd.post_kgc.push(kgc)
      const clarity = Number(post.post_goal_clarity)
      if (!isNaN(clarity)) cd.post_clarity.push(clarity)
      const readiness = Number(post.post_activation)
      if (!isNaN(readiness)) cd.post_readiness.push(readiness)
      const energy = Number(post.post_baseline_energy)
      if (!isNaN(energy)) cd.post_energy.push(energy)
      const help = Number(post.process_helpful)
      if (!isNaN(help)) cd.process_help.push(help)
      const frust = Number(post.process_frustrating)
      if (!isNaN(frust)) cd.process_frust.push(frust)

      cd.attn_total++
      if (attentionPassed(post)) cd.attn_pass++
    }

    const mins = sessionMinutes(p.session_start_at, p.session_end_at)
    if (mins !== null) cd.session_mins.push(mins)
  }

  // --- 3. AI coaching metrics (A2 only) ---
  const a2Participants = participants.filter(p => p.condition_a === 'A2')
  const roundCounts: number[] = []
  const goalTexts: { pid: string, initial: string, final: string | null, rounds: number, exitReason: string | null }[] = []
  const dimensionTrajectories: { round: number, ratings: Record<string, string> }[] = []

  for (const p of a2Participants) {
    const goal = participantGoals.get(p.id)
    if (!goal) continue
    const rs = goalRounds.get(goal.id) || []
    roundCounts.push(rs.length)
    goalTexts.push({ pid: p.prolific_pid, initial: goal.initial_text, final: goal.final_text, rounds: rs.length, exitReason: goal.exit_reason })
    for (const r of rs) {
      try {
        const dims = JSON.parse(r.ai_dimensions_json)
        const ratings: Record<string, string> = {}
        for (const d of ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']) {
          ratings[d] = dims[d]?.rating || 'unknown'
        }
        dimensionTrajectories.push({ round: r.round_number, ratings })
      } catch {}
    }
  }

  // Coach perception (A2 post surveys)
  const coachPerception = { useful: [] as number[], demanding: [] as number[], reuse: [] as number[] }
  for (const p of a2Participants) {
    const post = postSurveys.get(p.id)
    if (!post) continue
    if (!isNaN(Number(post.coach_useful))) coachPerception.useful.push(Number(post.coach_useful))
    if (!isNaN(Number(post.coach_demanding))) coachPerception.demanding.push(Number(post.coach_demanding))
    if (!isNaN(Number(post.coach_reuse))) coachPerception.reuse.push(Number(post.coach_reuse))
  }

  // --- 4. All goal texts ---
  const allGoalTexts: { pid: string, condA: string, condB: string, initial: string, final: string | null, rounds: number, wc_initial: number, wc_final: number }[] = []
  for (const p of participants) {
    const goal = participantGoals.get(p.id)
    if (!goal) continue
    allGoalTexts.push({
      pid: p.prolific_pid,
      condA: p.condition_a,
      condB: p.condition_b,
      initial: goal.initial_text,
      final: goal.final_text,
      rounds: goal.total_rounds || (goalRounds.get(goal.id) || []).length,
      wc_initial: wordCount(goal.initial_text),
      wc_final: wordCount(goal.final_text),
    })
  }

  // --- Build HTML ---
  function statCell(arr: number[], label?: string): string {
    if (arr.length === 0) return '<td class="num">—</td>'
    return `<td class="num">${fmt(mean(arr))} <span class="sd">±${fmt(sd(arr))}</span> <span class="n">(n=${arr.length})</span></td>`
  }

  function metricsTable(title: string, rows: { label: string, data: Record<string, number[]> }[]): string {
    let html = `<h2>${escapeHtml(title)}</h2><table><thead><tr><th>Measure</th>`
    for (const cell of cells) html += `<th>${cellLabel(cell.split('_')[0], cell.split('_')[1])}</th>`
    html += `</tr></thead><tbody>`
    for (const row of rows) {
      html += `<tr><td class="label">${escapeHtml(row.label)}</td>`
      for (const cell of cells) html += statCell(row.data[cell] || [])
      html += `</tr>`
    }
    html += `</tbody></table>`
    return html
  }

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Study Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #fff; color: #18181b; padding: 2rem; max-width: 1100px; margin: 0 auto; line-height: 1.5; }
  h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
  .subtitle { color: #71717a; font-size: 0.8rem; margin-bottom: 2rem; }
  h2 { font-size: 1.1rem; font-weight: 600; margin: 2rem 0 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e4e4e7; }
  table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 1rem; }
  th { text-align: left; padding: 0.4rem 0.6rem; background: #f4f4f5; border: 1px solid #e4e4e7; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; color: #52525b; }
  td { padding: 0.4rem 0.6rem; border: 1px solid #e4e4e7; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.label { font-weight: 500; white-space: nowrap; }
  .sd { color: #a1a1aa; font-size: 0.75rem; }
  .n { color: #a1a1aa; font-size: 0.7rem; }
  .pill { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
  .pill-green { background: #f0fdf4; color: #166534; }
  .pill-yellow { background: #fefce8; color: #854d0e; }
  .pill-red { background: #fef2f2; color: #991b1b; }
  .pill-gray { background: #f4f4f5; color: #52525b; }
  .goal-text { font-size: 0.78rem; color: #3f3f46; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section { margin-bottom: 1.5rem; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .stat-box { background: #f9fafb; border: 1px solid #e4e4e7; border-radius: 0.5rem; padding: 0.75rem 1rem; }
  .stat-box .big { font-size: 1.5rem; font-weight: 700; }
  .stat-box .desc { font-size: 0.75rem; color: #71717a; }
  .bar { display: inline-block; height: 14px; border-radius: 2px; }
  .bar-strong { background: #22c55e; }
  .bar-adequate { background: #eab308; }
  .bar-weak { background: #ef4444; }
  .warn { color: #dc2626; font-weight: 600; }
  pre { font-size: 0.75rem; background: #f9fafb; padding: 0.5rem; border-radius: 0.25rem; overflow-x: auto; }
  .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1rem 0; }
  .chart-box { background: #f9fafb; border: 1px solid #e4e4e7; border-radius: 0.5rem; padding: 1rem; }
  .chart-box h3 { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: #3f3f46; }
  canvas { max-height: 280px; }
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
</head><body>
<h1>Study Dashboard</h1>
<p class="subtitle">Beneficial Friction Study 1 — ${participants.length} participants, ${participants.filter(p => p.status === 'completed').length} completed — ${new Date().toISOString().slice(0, 16)}</p>`

  // --- Demographics ---
  const completedParticipants = participants.filter(p => p.status === 'completed')
  const demographics: Record<string, unknown>[] = []
  for (const p of completedParticipants) {
    try {
      if (p.demographics_json) demographics.push(JSON.parse(p.demographics_json))
    } catch {}
  }
  if (demographics.length > 0) {
    const ages = demographics.map(d => Number(d.age)).filter(a => !isNaN(a))
    const genders: Record<string, number> = {}
    const education: Record<string, number> = {}
    const priorGoalSetting: Record<string, number> = {}
    for (const d of demographics) {
      const g = String(d.gender || 'unknown')
      genders[g] = (genders[g] || 0) + 1
      const e = String(d.education_level || d.career_stage || 'unknown')
      education[e] = (education[e] || 0) + 1
      const p = String(d.prior_goal_setting || 'unknown')
      priorGoalSetting[p] = (priorGoalSetting[p] || 0) + 1
    }

    html += `<h2>Demographics (n=${demographics.length})</h2>`
    html += `<div class="grid2">`

    html += `<div><table><thead><tr><th colspan="2">Age</th></tr></thead><tbody>`
    html += `<tr><td class="label">Mean (SD)</td><td class="num">${fmt(mean(ages))} ±${fmt(sd(ages))}</td></tr>`
    html += `<tr><td class="label">Range</td><td class="num">${Math.min(...ages)}–${Math.max(...ages)}</td></tr>`
    html += `</tbody></table></div>`

    html += `<div><table><thead><tr><th>Gender</th><th>n</th></tr></thead><tbody>`
    for (const [g, n] of Object.entries(genders).sort((a, b) => b[1] - a[1])) {
      html += `<tr><td class="label">${escapeHtml(g)}</td><td class="num">${n}</td></tr>`
    }
    html += `</tbody></table></div>`

    html += `</div><div class="grid2" style="margin-top:0.5rem;">`

    html += `<div><table><thead><tr><th>Education Level</th><th>n</th></tr></thead><tbody>`
    for (const [e, n] of Object.entries(education).sort((a, b) => b[1] - a[1])) {
      html += `<tr><td class="label">${escapeHtml(e)}</td><td class="num">${n}</td></tr>`
    }
    html += `</tbody></table></div>`

    html += `<div><table><thead><tr><th>Prior Goal-Setting Experience</th><th>n</th></tr></thead><tbody>`
    for (const [p, n] of Object.entries(priorGoalSetting).sort((a, b) => b[1] - a[1])) {
      html += `<tr><td class="label">${escapeHtml(p)}</td><td class="num">${n}</td></tr>`
    }
    html += `</tbody></table></div>`

    html += `</div>`
  }

  // --- Recruitment ---
  html += `<h2>Recruitment Progress</h2><table><thead><tr><th>Cell</th><th>Total</th><th>Completed</th><th>Rate</th><th>Dropout by Step</th></tr></thead><tbody>`
  for (const r of recruitmentRows) {
    const rate = r.total > 0 ? Math.round(r.completed / r.total * 100) : 0
    const dropoutSteps = Object.entries(r.statusCounts).filter(([s, c]) => s !== 'completed' && c > 0).map(([s, c]) => `${s}:${c}`).join(', ')
    html += `<tr><td class="label">${cellLabel(r.a, r.b)} <span class="sd">${r.a}×${r.b}</span></td><td class="num">${r.total}/50</td><td class="num">${r.completed}</td><td class="num">${rate}%</td><td>${dropoutSteps || '—'}</td></tr>`
  }
  html += `</tbody></table>`

  // --- Main Effects (pooled) ---
  type PooledData = { pre_se: number[], post_se: number[], delta_se: number[], pre_kgc: number[], post_kgc: number[], delta_kgc: number[], pre_energy: number[], post_energy: number[], delta_energy: number[], post_clarity: number[], post_readiness: number[], process_help: number[], process_frust: number[], session_mins: number[] }
  function emptyPooled(): PooledData { return { pre_se: [], post_se: [], delta_se: [], pre_kgc: [], post_kgc: [], delta_kgc: [], pre_energy: [], post_energy: [], delta_energy: [], post_clarity: [], post_readiness: [], process_help: [], process_frust: [], session_mins: [] } }

  const pooled: Record<string, PooledData> = { A1: emptyPooled(), A2: emptyPooled(), B1: emptyPooled(), B2: emptyPooled() }

  for (const p of participants) {
    const targets = [pooled[p.condition_a], pooled[p.condition_b]]
    const pre = preSurveys.get(p.id)
    const post = postSurveys.get(p.id)

    for (const t of targets) {
      if (pre) {
        const se = Number(pre.goal_self_efficacy); if (!isNaN(se)) t.pre_se.push(se)
        const kgc = kgcComposite(pre); if (kgc !== null) t.pre_kgc.push(kgc)
        const energy = Number(pre.baseline_energy); if (!isNaN(energy)) t.pre_energy.push(energy)
      }
      if (post) {
        const se = Number(post.post_goal_self_efficacy); if (!isNaN(se)) t.post_se.push(se)
        const kgc = kgcComposite(post); if (kgc !== null) t.post_kgc.push(kgc)
        const energy = Number(post.post_baseline_energy); if (!isNaN(energy)) t.post_energy.push(energy)
        const clarity = Number(post.post_goal_clarity); if (!isNaN(clarity)) t.post_clarity.push(clarity)
        const readiness = Number(post.post_activation); if (!isNaN(readiness)) t.post_readiness.push(readiness)
        const help = Number(post.process_helpful); if (!isNaN(help)) t.process_help.push(help)
        const frust = Number(post.process_frustrating); if (!isNaN(frust)) t.process_frust.push(frust)
      }
      if (pre && post) {
        const preSE = Number(pre.goal_self_efficacy); const postSE = Number(post.post_goal_self_efficacy)
        if (!isNaN(preSE) && !isNaN(postSE)) t.delta_se.push(postSE - preSE)
        const preK = kgcComposite(pre); const postK = kgcComposite(post)
        if (preK !== null && postK !== null) t.delta_kgc.push(postK - preK)
        const preE = Number(pre.baseline_energy); const postE = Number(post.post_baseline_energy)
        if (!isNaN(preE) && !isNaN(postE)) t.delta_energy.push(postE - preE)
      }
      const mins = sessionMinutes(p.session_start_at, p.session_end_at)
      if (mins !== null) t.session_mins.push(mins)
    }
  }

  function mainEffectTable(title: string, factorLabels: [string, string], keys: [string, string], rows: { label: string, getter: (d: PooledData) => number[] }[]): string {
    let h = `<h3 style="font-size:0.95rem;font-weight:600;margin:1rem 0 0.5rem;">${escapeHtml(title)}</h3><table><thead><tr><th>Measure</th><th>${factorLabels[0]}</th><th>${factorLabels[1]}</th><th>Diff</th></tr></thead><tbody>`
    for (const row of rows) {
      const d0 = row.getter(pooled[keys[0]])
      const d1 = row.getter(pooled[keys[1]])
      const m0 = mean(d0); const m1 = mean(d1)
      const diff = d0.length > 0 && d1.length > 0 ? (m1 - m0) : NaN
      h += `<tr><td class="label">${escapeHtml(row.label)}</td>`
      h += statCell(d0)
      h += statCell(d1)
      h += `<td class="num">${!isNaN(diff) ? (diff >= 0 ? '+' : '') + fmt(diff) : '—'}</td></tr>`
    }
    h += `</tbody></table>`
    return h
  }

  const mainEffectRows: { label: string, getter: (d: PooledData) => number[] }[] = [
    { label: 'Self-Efficacy Pre', getter: d => d.pre_se },
    { label: 'Self-Efficacy Post', getter: d => d.post_se },
    { label: 'Self-Efficacy Δ', getter: d => d.delta_se },
    { label: 'KGC Pre', getter: d => d.pre_kgc },
    { label: 'KGC Post', getter: d => d.post_kgc },
    { label: 'KGC Δ', getter: d => d.delta_kgc },
    { label: 'Energy Pre', getter: d => d.pre_energy },
    { label: 'Energy Post', getter: d => d.post_energy },
    { label: 'Energy Δ', getter: d => d.delta_energy },
    { label: 'Goal Clarity (post)', getter: d => d.post_clarity },
    { label: 'Readiness (post)', getter: d => d.post_readiness },
    { label: 'Helpfulness', getter: d => d.process_help },
    { label: 'Frustration', getter: d => d.process_frust },
    { label: 'Session (min)', getter: d => d.session_mins },
  ]

  html += `<h2>Main Effects (Pooled)</h2>`
  html += mainEffectTable('Factor A: AI Coach', ['A1 — No AI', 'A2 — AI Coach'], ['A1', 'A2'], mainEffectRows)
  html += mainEffectTable('Factor B: Emotional Anchoring', ['B1 — No Anchoring', 'B2 — Anchoring'], ['B1', 'B2'], mainEffectRows)

  // --- Per-Cell DVs ---
  html += `<h2>Per-Cell Breakdown</h2>`
  html += metricsTable('Self-Efficacy (1-7)', [
    { label: 'Pre', data: Object.fromEntries(cells.map(c => [c, cellData[c].pre_se])) },
    { label: 'Post', data: Object.fromEntries(cells.map(c => [c, cellData[c].post_se])) },
    { label: 'Δ (post-pre)', data: Object.fromEntries(cells.map(c => {
      const cd = cellData[c]
      // Compute per-participant deltas where both exist
      const deltas: number[] = []
      for (const p of participants.filter(p => `${p.condition_a}_${p.condition_b}` === c)) {
        const pre = preSurveys.get(p.id)
        const post = postSurveys.get(p.id)
        if (pre && post) {
          const preSE = Number(pre.goal_self_efficacy)
          const postSE = Number(post.post_goal_self_efficacy)
          if (!isNaN(preSE) && !isNaN(postSE)) deltas.push(postSE - preSE)
        }
      }
      return [c, deltas]
    })) },
  ])

  html += metricsTable('Goal Commitment (KGC, 1-5)*', [
    { label: 'Pre', data: Object.fromEntries(cells.map(c => [c, cellData[c].pre_kgc])) },
    { label: 'Post', data: Object.fromEntries(cells.map(c => [c, cellData[c].post_kgc])) },
    { label: 'Δ (post-pre)', data: Object.fromEntries(cells.map(c => {
      const deltas: number[] = []
      for (const p of participants.filter(p => `${p.condition_a}_${p.condition_b}` === c)) {
        const pre = preSurveys.get(p.id)
        const post = postSurveys.get(p.id)
        if (pre && post) {
          const preK = kgcComposite(pre)
          const postK = kgcComposite(post)
          if (preK !== null && postK !== null) deltas.push(postK - preK)
        }
      }
      return [c, deltas]
    })) },
  ])

  html += `<p style="font-size:0.72rem;color:#71717a;margin-top:-0.5rem;">* KGC = Klein et al. Goal Commitment Scale (2001). 5 items, 1-5 Likert. Items 1, 2, 4 are reverse-coded so higher = more committed.</p>`

  html += metricsTable('Energy (1-7)', [
    { label: 'Pre', data: Object.fromEntries(cells.map(c => [c, cellData[c].pre_energy])) },
    { label: 'Post', data: Object.fromEntries(cells.map(c => [c, cellData[c].post_energy])) },
    { label: 'Δ (post-pre)', data: Object.fromEntries(cells.map(c => {
      const deltas: number[] = []
      for (const p of participants.filter(p => `${p.condition_a}_${p.condition_b}` === c)) {
        const pre = preSurveys.get(p.id)
        const post = postSurveys.get(p.id)
        if (pre && post) {
          const preE = Number(pre.baseline_energy)
          const postE = Number(post.post_baseline_energy)
          if (!isNaN(preE) && !isNaN(postE)) deltas.push(postE - preE)
        }
      }
      return [c, deltas]
    })) },
  ])

  html += metricsTable('Post-Session Single Items', [
    { label: 'Goal Clarity (1-7)', data: Object.fromEntries(cells.map(c => [c, cellData[c].post_clarity])) },
    { label: 'Readiness (1-7)', data: Object.fromEntries(cells.map(c => [c, cellData[c].post_readiness])) },
  ])

  html += metricsTable('Process Experience (1-7)', [
    { label: 'Helpfulness', data: Object.fromEntries(cells.map(c => [c, cellData[c].process_help])) },
    { label: 'Frustration', data: Object.fromEntries(cells.map(c => [c, cellData[c].process_frust])) },
  ])

  html += metricsTable('Session Duration (minutes)', [
    { label: 'Duration', data: Object.fromEntries(cells.map(c => [c, cellData[c].session_mins])) },
  ])

  // --- Attention checks ---
  html += `<h2>Attention Checks</h2><table><thead><tr><th>Cell</th><th>Passed</th><th>Failed</th><th>Pass Rate</th></tr></thead><tbody>`
  for (const cell of cells) {
    const cd = cellData[cell]
    const [a, b] = cell.split('_')
    const failed = cd.attn_total - cd.attn_pass
    const rate = cd.attn_total > 0 ? Math.round(cd.attn_pass / cd.attn_total * 100) : 0
    html += `<tr><td class="label">${cellLabel(a, b)}</td><td class="num">${cd.attn_pass}</td><td class="num ${failed > 0 ? 'warn' : ''}">${failed}</td><td class="num">${rate}%</td></tr>`
  }
  html += `</tbody></table>`

  // --- AI Coaching (A2 only) ---
  html += `<h2>AI Coaching Metrics (A2 only)</h2>`

  if (roundCounts.length > 0) {
    html += `<div class="grid2" style="margin-bottom:1rem;">`
    html += `<div class="stat-box"><div class="big">${fmt(mean(roundCounts))}</div><div class="desc">Mean refinement rounds (n=${roundCounts.length})</div></div>`
    html += `<div class="stat-box"><div class="big">${Math.max(...roundCounts)}</div><div class="desc">Max rounds in a session</div></div>`
    html += `</div>`

    // Round distribution
    const maxRound = Math.max(...roundCounts, 1)
    const roundDist: Record<number, number> = {}
    for (const r of roundCounts) roundDist[r] = (roundDist[r] || 0) + 1
    html += `<table><thead><tr><th>Rounds</th>`
    for (let i = 0; i <= maxRound; i++) html += `<th>${i}</th>`
    html += `</tr></thead><tbody><tr><td class="label">Count</td>`
    for (let i = 0; i <= maxRound; i++) html += `<td class="num">${roundDist[i] || 0}</td>`
    html += `</tr></tbody></table>`

    // Dimension quality by round
    if (dimensionTrajectories.length > 0) {
      const roundNums = [...new Set(dimensionTrajectories.map(d => d.round))].sort((a, b) => a - b)
      const dims = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']
      html += `<h2>Quality Trajectory by Round (A2)</h2>`
      html += `<table><thead><tr><th>Dimension</th>`
      for (const rn of roundNums) html += `<th>Round ${rn}</th>`
      html += `</tr></thead><tbody>`
      for (const dim of dims) {
        html += `<tr><td class="label">${dim}</td>`
        for (const rn of roundNums) {
          const entries = dimensionTrajectories.filter(d => d.round === rn)
          const strong = entries.filter(d => d.ratings[dim] === 'strong').length
          const adequate = entries.filter(d => d.ratings[dim] === 'adequate').length
          const weak = entries.filter(d => d.ratings[dim] === 'weak').length
          const total = entries.length
          if (total === 0) { html += `<td>—</td>`; continue }
          const pct = (n: number) => Math.round(n / total * 100)
          html += `<td><span class="bar bar-strong" style="width:${pct(strong)}px"></span><span class="bar bar-adequate" style="width:${pct(adequate)}px"></span><span class="bar bar-weak" style="width:${pct(weak)}px"></span> <span class="sd">${pct(strong)}/${pct(adequate)}/${pct(weak)}%</span></td>`
        }
        html += `</tr>`
      }
      html += `</tbody></table>`
    }

    // Coach perception
    if (coachPerception.useful.length > 0) {
      html += `<h2>Coach Perception (A2, 1-7)</h2><table><thead><tr><th>Item</th><th>Mean ± SD</th><th>n</th></tr></thead><tbody>`
      html += `<tr><td class="label">How much did the AI feedback help you improve your goal?</td><td class="num">${fmt(mean(coachPerception.useful))} ±${fmt(sd(coachPerception.useful))}</td><td class="num">${coachPerception.useful.length}</td></tr>`
      html += `<tr><td class="label">How demanding or unreasonable was the AI feedback?</td><td class="num">${fmt(mean(coachPerception.demanding))} ±${fmt(sd(coachPerception.demanding))}</td><td class="num">${coachPerception.demanding.length}</td></tr>`
      html += `<tr><td class="label">How likely would you be to use this tool again?</td><td class="num">${fmt(mean(coachPerception.reuse))} ±${fmt(sd(coachPerception.reuse))}</td><td class="num">${coachPerception.reuse.length}</td></tr>`
      html += `</tbody></table>`
    }
  } else {
    html += `<p style="color:#71717a">No A2 data yet.</p>`
  }

  // --- Goal Texts ---
  html += `<h2>Goal Texts</h2><table><thead><tr><th>PID</th><th>Cell</th><th>Initial Goal</th><th>Words</th><th>Final Goal</th><th>Words</th><th>Rounds</th></tr></thead><tbody>`
  for (const g of allGoalTexts) {
    html += `<tr><td style="font-size:0.7rem;font-family:monospace">${escapeHtml(g.pid.slice(0, 20))}</td>`
    html += `<td><span class="pill pill-gray">${g.condA}×${g.condB}</span></td>`
    html += `<td class="goal-text" title="${escapeHtml(g.initial)}">${escapeHtml(g.initial)}</td>`
    html += `<td class="num">${g.wc_initial}</td>`
    html += `<td class="goal-text" title="${escapeHtml(g.final || '—')}">${escapeHtml(g.final || '—')}</td>`
    html += `<td class="num">${g.wc_final}</td>`
    html += `<td class="num">${g.rounds}</td></tr>`
  }
  html += `</tbody></table>`

  // --- Open-Ended: Coach Experience (A2 only) ---
  const coachExperiences: { pid: string, text: string }[] = []
  for (const p of a2Participants) {
    const post = postSurveys.get(p.id)
    if (!post) continue
    const text = String(post.coach_experience || '').trim()
    if (text) coachExperiences.push({ pid: p.prolific_pid, text })
  }
  if (coachExperiences.length > 0) {
    html += `<h2>Coach Experience — Open-Ended (A2 only)</h2><table><thead><tr><th>PID</th><th>Response</th></tr></thead><tbody>`
    for (const ce of coachExperiences) {
      html += `<tr><td style="font-size:0.7rem;font-family:monospace">${escapeHtml(ce.pid.slice(0, 20))}</td><td style="font-size:0.8rem;max-width:700px">${escapeHtml(ce.text)}</td></tr>`
    }
    html += `</tbody></table>`
  }

  // --- Open-Ended: Process Reflections (all conditions) ---
  const processReflections: { pid: string, cell: string, text: string }[] = []
  for (const p of participants) {
    const post = postSurveys.get(p.id)
    if (!post) continue
    const text = String(post.process_comparison || '').trim()
    if (text) processReflections.push({ pid: p.prolific_pid, cell: `${p.condition_a}×${p.condition_b}`, text })
  }
  if (processReflections.length > 0) {
    html += `<h2>Process Reflections — Open-Ended</h2><table><thead><tr><th>PID</th><th>Cell</th><th>Response</th></tr></thead><tbody>`
    for (const pr of processReflections) {
      html += `<tr><td style="font-size:0.7rem;font-family:monospace">${escapeHtml(pr.pid.slice(0, 20))}</td><td><span class="pill pill-gray">${pr.cell}</span></td><td style="font-size:0.8rem;max-width:600px">${escapeHtml(pr.text)}</td></tr>`
    }
    html += `</tbody></table>`
  }

  // --- Anchoring Visions (B2 only) ---
  interface AnchoringRow { participant_id: number, pleasure_vision: string, pain_vision: string }
  const anchoringData = db.prepare('SELECT * FROM anchoring').all() as AnchoringRow[]
  if (anchoringData.length > 0) {
    html += `<h2>Pleasure &amp; Pain Visions (B2 only)</h2><table><thead><tr><th>PID</th><th>Cell</th><th>Pleasure Vision</th><th>Pain Vision</th></tr></thead><tbody>`
    for (const a of anchoringData) {
      const p = participants.find(p => p.id === a.participant_id)
      if (!p) continue
      html += `<tr><td style="font-size:0.7rem;font-family:monospace">${escapeHtml(p.prolific_pid.slice(0, 20))}</td>`
      html += `<td><span class="pill pill-gray">${p.condition_a}×${p.condition_b}</span></td>`
      html += `<td style="font-size:0.78rem;max-width:350px">${escapeHtml(a.pleasure_vision)}</td>`
      html += `<td style="font-size:0.78rem;max-width:350px">${escapeHtml(a.pain_vision)}</td></tr>`
    }
    html += `</tbody></table>`
  }

  // --- Charts ---
  const cellLabels = cells.map(c => cellLabel(c.split('_')[0], c.split('_')[1]))
  const COLORS = { control: '#71717a', ai: '#f97316', anchoring: '#8b5cf6', both: '#0ea5e9' }
  const cellColors = ['#71717a', '#f97316', '#8b5cf6', '#0ea5e9']

  html += `<h2>Charts</h2>`

  // Row 1: Recruitment + Self-Efficacy Pre/Post
  html += `<div class="chart-row">`
  html += `<div class="chart-box"><h3>Recruitment Progress</h3><canvas id="chartRecruit"></canvas></div>`
  html += `<div class="chart-box"><h3>Self-Efficacy Pre vs Post</h3><canvas id="chartSE"></canvas></div>`
  html += `</div>`

  // Row 2: KGC Pre/Post + Post Single Items
  html += `<div class="chart-row">`
  html += `<div class="chart-box"><h3>Goal Commitment (KGC) Pre vs Post</h3><canvas id="chartKGC"></canvas></div>`
  html += `<div class="chart-box"><h3>Post-Session Measures</h3><canvas id="chartPost"></canvas></div>`
  html += `</div>`

  // Row 3: Process Experience + Refinement Rounds
  html += `<div class="chart-row">`
  html += `<div class="chart-box"><h3>Process Experience</h3><canvas id="chartProcess"></canvas></div>`
  html += `<div class="chart-box"><h3>Refinement Round Distribution (A2)</h3><canvas id="chartRounds"></canvas></div>`
  html += `</div>`

  // Row 4: Quality Trajectory + Dimension Compliance
  html += `<div class="chart-row">`
  html += `<div class="chart-box"><h3>Quality Trajectory by Round (Mean Score)</h3><canvas id="chartTrajectory"></canvas></div>`
  html += `<div class="chart-box"><h3>Self-Efficacy Change (Δ)</h3><canvas id="chartDelta"></canvas></div>`
  html += `</div>`

  // Prepare trajectory data: mean quality score per dimension per round (weak=1, adequate=2, strong=3)
  const dims = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']
  const trajRoundNums = [...new Set(dimensionTrajectories.map(d => d.round))].sort((a, b) => a - b)
  const ratingToScore = (r: string): number => r === 'strong' ? 3 : r === 'adequate' ? 2 : 1
  const trajData: Record<string, number[]> = {}
  const trajN: number[] = trajRoundNums.map(rn => dimensionTrajectories.filter(d => d.round === rn).length)
  for (const dim of dims) {
    trajData[dim] = trajRoundNums.map(rn => {
      const entries = dimensionTrajectories.filter(d => d.round === rn)
      if (entries.length === 0) return 0
      const scores = entries.map(d => ratingToScore(d.ratings[dim]))
      return +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
    })
  }

  // Compute deltas for delta chart
  const deltaData: Record<string, number> = {}
  for (const c of cells) {
    const deltas: number[] = []
    for (const p of participants.filter(p => `${p.condition_a}_${p.condition_b}` === c)) {
      const pre = preSurveys.get(p.id)
      const post = postSurveys.get(p.id)
      if (pre && post) {
        const preSE = Number(pre.goal_self_efficacy)
        const postSE = Number(post.post_goal_self_efficacy)
        if (!isNaN(preSE) && !isNaN(postSE)) deltas.push(postSE - preSE)
      }
    }
    deltaData[c] = deltas.length > 0 ? mean(deltas) : 0
  }

  // Round distribution for chart
  const maxRoundForChart = Math.max(...roundCounts, 1)
  const roundDistForChart: number[] = []
  for (let i = 0; i <= maxRoundForChart; i++) {
    roundDistForChart.push(roundCounts.filter(r => r === i).length)
  }

  const dimColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

  html += `
<script>
const cellLabels = ${JSON.stringify(cellLabels)};
const cellColors = ${JSON.stringify(cellColors)};
const defaults = Chart.defaults;
defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
defaults.font.size = 11;
defaults.plugins.legend.labels.boxWidth = 12;

// Recruitment
new Chart(document.getElementById('chartRecruit'), {
  type: 'bar',
  data: {
    labels: cellLabels,
    datasets: [
      { label: 'Completed', data: ${JSON.stringify(recruitmentRows.map(r => r.completed))}, backgroundColor: cellColors },
      { label: 'Target', data: [50,50,50,50], backgroundColor: 'rgba(0,0,0,0)', borderColor: '#d4d4d8', borderWidth: 1, borderDash: [4,4] }
    ]
  },
  options: { scales: { y: { beginAtZero: true, max: 60 } }, plugins: { legend: { display: true } } }
});

// Self-Efficacy Pre/Post
new Chart(document.getElementById('chartSE'), {
  type: 'bar',
  data: {
    labels: cellLabels,
    datasets: [
      { label: 'Pre', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].pre_se).toFixed(2)))}, backgroundColor: cellColors.map(c => c + '66') },
      { label: 'Post', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].post_se).toFixed(2)))}, backgroundColor: cellColors }
    ]
  },
  options: { scales: { y: { beginAtZero: false, min: 1, max: 7 } } }
});

// KGC Pre/Post
new Chart(document.getElementById('chartKGC'), {
  type: 'bar',
  data: {
    labels: cellLabels,
    datasets: [
      { label: 'Pre', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].pre_kgc).toFixed(2)))}, backgroundColor: cellColors.map(c => c + '66') },
      { label: 'Post', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].post_kgc).toFixed(2)))}, backgroundColor: cellColors }
    ]
  },
  options: { scales: { y: { beginAtZero: false, min: 1, max: 5 } } }
});

// Post Single Items
new Chart(document.getElementById('chartPost'), {
  type: 'bar',
  data: {
    labels: cellLabels,
    datasets: [
      { label: 'Clarity', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].post_clarity).toFixed(2)))}, backgroundColor: '#3b82f6' },
      { label: 'Readiness', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].post_readiness).toFixed(2)))}, backgroundColor: '#22c55e' },
      { label: 'Energy', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].post_energy).toFixed(2)))}, backgroundColor: '#eab308' }
    ]
  },
  options: { scales: { y: { beginAtZero: false, min: 1, max: 7 } } }
});

// Process Experience
new Chart(document.getElementById('chartProcess'), {
  type: 'bar',
  data: {
    labels: cellLabels,
    datasets: [
      { label: 'Helpfulness', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].process_help).toFixed(2)))}, backgroundColor: '#22c55e' },
      { label: 'Frustration', data: ${JSON.stringify(cells.map(c => +mean(cellData[c].process_frust).toFixed(2)))}, backgroundColor: '#ef4444' }
    ]
  },
  options: { scales: { y: { beginAtZero: false, min: 1, max: 7 } } }
});

// Refinement Rounds Distribution
new Chart(document.getElementById('chartRounds'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(Array.from({length: maxRoundForChart + 1}, (_, i) => i.toString()))},
    datasets: [{ label: 'Participants', data: ${JSON.stringify(roundDistForChart)}, backgroundColor: '#f97316' }]
  },
  options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
});

// Quality Trajectory (mean score per dimension across rounds, weak=1 adequate=2 strong=3)
new Chart(document.getElementById('chartTrajectory'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(trajRoundNums.map((r, i) => `R${r} (n=${trajN[i]})`))},
    datasets: ${JSON.stringify(dims.map((dim, i) => ({
      label: dim,
      data: trajData[dim],
      borderColor: dimColors[i],
      backgroundColor: dimColors[i] + '22',
      tension: 0.3,
      fill: false,
      pointRadius: 4,
    })))}
  },
  options: { scales: { y: { min: 1, max: 3, title: { display: true, text: 'Mean (1=weak, 2=adequate, 3=strong)' } } } }
});

// Self-Efficacy Delta
new Chart(document.getElementById('chartDelta'), {
  type: 'bar',
  data: {
    labels: cellLabels,
    datasets: [{ label: 'Δ Self-Efficacy', data: ${JSON.stringify(cells.map(c => +(deltaData[c]).toFixed(2)))}, backgroundColor: cellColors }]
  },
  options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
});
</script>`

  html += `</body></html>`

  res.type('html').send(html)
})

export default router
