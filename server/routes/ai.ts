import { Router } from 'express'
import db from '../db.js'
import { GOAL_COACH_SYSTEM_PROMPT, buildUserPrompt } from '../ai-prompts.js'

const router = Router()

router.post('/goal-coach', async (req, res) => {
  const { goal_id, goal_text, previous_feedback } = req.body

  if (!goal_id || !goal_text) {
    return res.status(400).json({ error: 'goal_id and goal_text required' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' })
  }

  // Mark refinement start on first round
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goal_id) as any
  if (goal && !goal.refinement_start_at) {
    db.prepare("UPDATE goals SET refinement_start_at = datetime('now') WHERE id = ?").run(goal_id)
  }

  const userMessage = buildUserPrompt(goal_text, previous_feedback)

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://portal.edgeacademia.com',
        'X-Title': 'Edge Academia LaunchPad Study',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        messages: [
          { role: 'system', content: GOAL_COACH_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', response.status, errorText)
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await response.json()
    const aiContent = data.choices?.[0]?.message?.content || ''

    let parsed: any
    try {
      parsed = JSON.parse(aiContent)
    } catch {
      const stripped = aiContent.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      try {
        parsed = JSON.parse(stripped)
      } catch {
        console.error('Failed to parse AI response:', aiContent)
        return res.status(502).json({ error: 'Failed to parse AI response' })
      }
    }

    // Determine weakest dimension
    const dims = parsed.dimensions || {}
    const weakest = (['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as const)
      .filter(d => dims[d]?.rating === 'weak')
      .concat((['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as const)
        .filter(d => dims[d]?.rating === 'okay'))
    const flaggedDimension = weakest[0] || null

    // Get current round number
    const roundCount = db.prepare('SELECT COUNT(*) as c FROM refinement_rounds WHERE goal_id = ?').get(goal_id) as any
    const roundNumber = (roundCount?.c || 0) + 1

    // Log the refinement round
    db.prepare(`
      INSERT INTO refinement_rounds (goal_id, round_number, goal_text, ai_feedback, ai_suggestion, ai_overall, ai_dimensions_json, flagged_dimension, feedback_received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      goal_id,
      roundNumber,
      goal_text,
      parsed.feedback || '',
      parsed.suggestion || '',
      parsed.overall || 'weak',
      JSON.stringify(parsed.dimensions || {}),
      flaggedDimension,
    )

    res.json(parsed)
  } catch (err) {
    console.error('AI route error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
