export type ConditionA = 'A1' | 'A2'  // A1 = No AI, A2 = AI Coach
export type ConditionB = 'B1' | 'B2'  // B1 = No Anchoring, B2 = Anchoring

export interface StudyParams {
  prolificPid: string
  studyId: string
  sessionId: string
  conditionA: ConditionA
  conditionB: ConditionB
}

export interface Participant {
  id: number
  prolific_pid: string
  condition_a: ConditionA
  condition_b: ConditionB
  status: string
}

export interface GoalCoachResult {
  overall: 'strong' | 'adequate' | 'weak'
  dimensions: {
    specific: { rating: 'strong' | 'adequate' | 'weak'; note: string }
    measurable: { rating: 'strong' | 'adequate' | 'weak'; note: string }
    achievable: { rating: 'strong' | 'adequate' | 'weak'; note: string }
    relevant: { rating: 'strong' | 'adequate' | 'weak'; note: string }
    timeBound: { rating: 'strong' | 'adequate' | 'weak'; note: string }
  }
  feedback: string
  suggestion: string
}

export type SurveyType = 'pre_measure' | 'post_measure' | 'priming_compliance' | 'followup'
export type ExitReason = 'satisfied' | 'enough_time' | 'not_helpful' | 'other'
