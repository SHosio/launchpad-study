import type { Participant, GoalCoachResult, SurveyType, ExitReason } from './types'

const BASE = '/api'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  createParticipant(data: {
    prolific_pid: string
    study_id: string
    session_id: string
    condition_a: string
    condition_b: string
  }): Promise<Participant> {
    return post('/participants', data)
  },

  updateStatus(participantId: number, status: string): Promise<void> {
    return post(`/participants/${participantId}/status`, { status })
  },

  saveSurvey(participantId: number, surveyType: SurveyType, responses: Record<string, unknown>): Promise<void> {
    return post('/surveys', { participant_id: participantId, survey_type: surveyType, responses })
  },

  saveDemographics(participantId: number, demographics: Record<string, unknown>): Promise<void> {
    return post(`/participants/${participantId}/demographics`, { demographics })
  },

  createGoal(participantId: number, initialText: string, writingStartAt: string): Promise<{ goal_id: number }> {
    return post('/goals', { participant_id: participantId, initial_text: initialText, writing_start_at: writingStartAt })
  },

  finalizeGoal(goalId: number, finalText: string, exitReason?: ExitReason): Promise<void> {
    return post(`/goals/${goalId}/finalize`, { final_text: finalText, exit_reason: exitReason })
  },

  getGoalCoachFeedback(goalId: number, goalText: string, previousFeedback: string | null): Promise<GoalCoachResult> {
    return post('/ai/goal-coach', { goal_id: goalId, goal_text: goalText, previous_feedback: previousFeedback })
  },

  getParticipantGoal(participantId: number): Promise<{ goal_text: string }> {
    return fetch(`${BASE}/goals/by-participant/${participantId}`).then(r => r.json())
  },

  saveAnchoring(participantId: number, pleasureVision: string, painVision: string): Promise<void> {
    return post('/anchoring', { participant_id: participantId, pleasure_vision: pleasureVision, pain_vision: painVision })
  },

  saveFollowup(participantId: number, data: Record<string, unknown>): Promise<void> {
    return post('/followup', { participant_id: participantId, ...data })
  },

  lookupParticipant(prolificPid: string): Promise<Participant | null> {
    return fetch(`${BASE}/participants/${encodeURIComponent(prolificPid)}`)
      .then(r => r.ok ? r.json() : null)
  },
}
