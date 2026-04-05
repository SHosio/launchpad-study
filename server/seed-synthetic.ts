/**
 * Seed synthetic data for dashboard testing.
 * Run: npx tsx server/seed-synthetic.ts
 */
import 'dotenv/config'
import db from './db.js'

const CONDITIONS = [
  { a: 'A1', b: 'B1' },
  { a: 'A2', b: 'B1' },
  { a: 'A1', b: 'B2' },
  { a: 'A2', b: 'B2' },
]

const SAMPLE_GOALS = [
  'Submit my first journal paper to TOCHI by April 25',
  'Complete the literature review chapter of my dissertation',
  'Finish data analysis for my user study and write up results',
  'Prepare and submit a workshop paper to CSCW 2027',
  'Write a complete first draft of my research proposal',
  'Design and pilot a survey instrument for my thesis study',
  'Revise my rejected CHI paper based on reviewer feedback',
  'Complete IRB application and get approval for my field study',
  'Write the methodology section of my thesis within 3 weeks',
  'Analyze interview transcripts and identify key themes by May 1',
  'Submit a grant application for summer research funding',
  'Build a working prototype of my research tool by end of April',
]

const REFINED_GOALS = [
  'Submit my first journal paper to TOCHI by April 25, with all co-author feedback addressed, because this publication is critical for my tenure case review in September',
  'Complete a polished 8,000-word literature review chapter and send it to my supervisor by April 20, so I stay on track for my September dissertation defense',
  'Finish the statistical analysis of my 45-participant user study and write a complete results section (with figures) by April 28, so my co-authors can review before our CHI deadline',
  'Submit a 4-page workshop paper to the CSCW 2027 Social AI workshop by the April 30 deadline, building on the pilot data I collected last month',
  'Write a complete 15-page first draft of my PhD research proposal and share with my committee by May 2, hitting all five required sections',
]

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function randChoice<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60000).toISOString().replace('T', ' ').slice(0, 19)
}

// Clear existing test data
db.prepare('DELETE FROM refinement_rounds').run()
db.prepare('DELETE FROM survey_responses').run()
db.prepare('DELETE FROM anchoring').run()
db.prepare('DELETE FROM followup_responses').run()
db.prepare('DELETE FROM goals').run()
db.prepare('DELETE FROM participants').run()

console.log('Cleared existing data')

const genders = ['man', 'woman', 'non_binary', 'prefer_not']
const stages = ['phd_student', 'postdoc', 'junior_faculty']
const fields = ['Computer Science', 'Psychology', 'Education', 'Information Science', 'Linguistics', 'Sociology']
const institutions = ['University of Oulu', 'Aalto University', 'TU Delft', 'UCL', 'MIT', 'ETH Zurich', 'KTH', 'University of Melbourne']

let participantCount = 0

for (const cond of CONDITIONS) {
  // 12-15 completed per cell, 2-3 incomplete
  const nCompleted = rand(12, 15)
  const nIncomplete = rand(2, 3)

  for (let i = 0; i < nCompleted + nIncomplete; i++) {
    participantCount++
    const isComplete = i < nCompleted
    const pid = `synth_${cond.a}${cond.b}_${participantCount}`
    const isA2 = cond.a === 'A2'
    const isB2 = cond.b === 'B2'

    const sessionStart = minutesAgo(rand(100, 5000))
    const sessionEnd = isComplete ? minutesAgo(rand(1, 99)) : null
    const dropoutStep = isComplete ? 'completed' : randChoice(['pre_measure', 'goal_writing', 'coaching', 'post_measure'])

    const demographics = JSON.stringify({
      consent_given: ['yes'],
      age: rand(23, 38),
      gender: randChoice(genders),
      career_stage: randChoice(stages),
      field_of_study: randChoice(fields),
      institution: randChoice(institutions),
      prior_goal_setting: rand(0, 1) ? 'yes' : 'no',
    })

    db.prepare(`INSERT INTO participants (prolific_pid, condition_a, condition_b, status, demographics_json, session_start_at, session_end_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      pid, cond.a, cond.b, isComplete ? 'completed' : dropoutStep, demographics, sessionStart, sessionEnd
    )

    const pRow = db.prepare('SELECT id FROM participants WHERE prolific_pid = ?').get(pid) as any
    const participantId = pRow.id

    // Pre-measure
    // AI conditions get slightly lower pre self-efficacy (randomization check)
    const preSE = rand(2, 6)
    const preKGC = [rand(1, 4), rand(1, 4), rand(2, 5), rand(1, 4), rand(2, 5)] // items 1-5
    const preEnergy = rand(1, 5)

    db.prepare('INSERT INTO survey_responses (participant_id, survey_type, responses_json) VALUES (?, ?, ?)').run(
      participantId, 'pre_measure', JSON.stringify({
        goal_self_efficacy: preSE,
        kgc_1: preKGC[0], kgc_2: preKGC[1], kgc_3: preKGC[2], kgc_4: preKGC[3], kgc_5: preKGC[4],
        baseline_energy: preEnergy,
      })
    )

    if (!isComplete) continue

    // Goal
    const goalText = randChoice(SAMPLE_GOALS)
    const nRounds = isA2 ? rand(1, 5) : 0
    const finalText = isA2 ? randChoice(REFINED_GOALS) : goalText
    const exitReason = isA2 && nRounds < 4 ? randChoice(['satisfied', 'enough_time', 'satisfied', 'satisfied']) : null

    db.prepare('INSERT INTO goals (participant_id, initial_text, final_text, total_rounds, exit_reason, goal_writing_start_at, goal_writing_end_at, refinement_start_at, refinement_end_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      participantId, goalText, finalText, nRounds, exitReason,
      minutesAgo(rand(50, 200)), minutesAgo(rand(20, 49)),
      isA2 ? minutesAgo(rand(25, 48)) : null,
      isA2 ? minutesAgo(rand(21, 24)) : null,
    )

    const goalRow = db.prepare('SELECT id FROM goals WHERE participant_id = ? ORDER BY id DESC LIMIT 1').get(participantId) as any
    const goalId = goalRow.id

    // Refinement rounds (A2 only)
    if (isA2) {
      const dims = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']
      for (let r = 1; r <= nRounds; r++) {
        // Quality improves across rounds
        const ratingForRound = (dim: string): string => {
          const base = rand(1, 10)
          const boost = r * 2
          const score = base + boost
          if (score >= 10) return 'strong'
          if (score >= 5) return 'adequate'
          return 'weak'
        }
        const dimRatings: Record<string, { rating: string, note: string }> = {}
        let weakest: string | null = null
        for (const d of dims) {
          const rating = ratingForRound(d)
          dimRatings[d] = { rating, note: `Round ${r} ${rating} for ${d}` }
          if (rating === 'weak' && !weakest) weakest = d
          else if (rating === 'adequate' && !weakest) weakest = d
        }
        const overallRatings = Object.values(dimRatings).map(d => d.rating)
        const overall = overallRatings.every(r => r === 'strong') ? 'strong' : overallRatings.some(r => r === 'weak') ? 'weak' : 'adequate'

        db.prepare('INSERT INTO refinement_rounds (goal_id, round_number, goal_text, ai_feedback, ai_suggestion, ai_overall, ai_dimensions_json, flagged_dimension, submitted_at, feedback_received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          goalId, r,
          r === 1 ? goalText : `${goalText} (revised round ${r})`,
          `Round ${r} feedback: Your goal is getting better.`,
          `Consider improving ${weakest || 'specificity'}.`,
          overall,
          JSON.stringify(dimRatings),
          weakest || 'specific',
          minutesAgo(rand(22, 45)),
          minutesAgo(rand(22, 45)),
        )
      }
    }

    // Anchoring (B2 only)
    if (isB2) {
      db.prepare('INSERT INTO anchoring (participant_id, pleasure_vision, pain_vision) VALUES (?, ?, ?)').run(
        participantId,
        'I see myself presenting my work at a conference, feeling proud and accomplished. My supervisor congratulates me and I feel like I belong in academia.',
        'Nothing changes. I keep procrastinating, the deadline passes, and I feel the same guilt and frustration I have been feeling for months.',
      )

      // Priming compliance
      db.prepare('INSERT INTO survey_responses (participant_id, survey_type, responses_json) VALUES (?, ?, ?)').run(
        participantId, 'priming_compliance', JSON.stringify({
          priming_activity: 'I did some deep breathing and thought about why this goal matters to me.',
          priming_energy: rand(3, 7),
        })
      )
    }

    // Post-measure
    // A2 participants get a slight boost in self-efficacy and clarity
    const seBoost = isA2 ? rand(0, 2) : rand(-1, 1)
    const postSE = Math.min(7, Math.max(1, preSE + seBoost))
    const postKGC = preKGC.map(v => Math.min(5, Math.max(1, v + rand(-1, 1))))
    const postClarity = rand(3, 7)
    const postReadiness = rand(3, 7)
    const postEnergy = rand(1, 5)
    const processHelp = isA2 ? rand(3, 5) : rand(1, 4)
    const processFrust = isA2 ? rand(1, 3) : rand(1, 2)
    const attn1 = rand(0, 10) > 1 ? 4 : rand(1, 5) // 90% pass
    const attn2 = rand(0, 10) > 1 ? 4 : rand(1, 5)

    const postData: Record<string, unknown> = {
      post_goal_self_efficacy: postSE,
      kgc_post_1: postKGC[0], kgc_post_2: postKGC[1], kgc_post_3: postKGC[2], kgc_post_4: postKGC[3], kgc_post_5: postKGC[4],
      post_goal_clarity: postClarity,
      post_activation: postReadiness,
      post_baseline_energy: postEnergy,
      process_helpful: processHelp,
      process_frustrating: processFrust,
      attention_check_1: attn1,
      attention_check_2: attn2,
      process_comparison: rand(0, 1) ? 'The process was interesting.' : '',
    }

    if (isA2) {
      postData.coach_useful = rand(3, 5)
      postData.coach_demanding = rand(1, 3)
      postData.coach_reuse = rand(3, 5)
      postData.coach_experience = 'The AI feedback was helpful in making me think more carefully about my goal.'
    }

    db.prepare('INSERT INTO survey_responses (participant_id, survey_type, responses_json) VALUES (?, ?, ?)').run(
      participantId, 'post_measure', JSON.stringify(postData)
    )
  }
}

console.log(`Seeded ${participantCount} participants across 4 conditions`)
console.log('Done!')
