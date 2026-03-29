import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Participant, ConditionA, ConditionB, ExitReason } from '@/lib/types'
import { SurveyPage } from '@/components/SurveyPage'
import { GoalWritingStep } from '@/components/GoalWritingStep'
import { AiRefinementLoop } from '@/components/AiRefinementLoop'
import { PrimingStep } from '@/components/PrimingStep'
import { AnchoringStep } from '@/components/AnchoringStep'
import { ProgressBar } from '@/components/ProgressBar'
import { demographicsSurvey } from '@/surveys/demographics'
import { preMeasureSurvey } from '@/surveys/pre-measure'
import { buildPostMeasureSurvey } from '@/surveys/post-measure'
import { primingComplianceSurvey } from '@/surveys/priming-compliance'

type StudyStep =
  | 'loading'
  | 'demographics'
  | 'pre_measure'
  | 'priming'
  | 'priming_compliance'
  | 'goal_writing'
  | 'coaching'
  | 'anchoring'
  | 'post_measure'

function getStepLabels(a: ConditionA, b: ConditionB): string[] {
  const steps = ['Info']
  steps.push('Pre-Survey')
  if (b === 'B2') steps.push('Priming')
  steps.push('Goal')
  if (a === 'A2') steps.push('Coach')
  if (b === 'B2') steps.push('Anchor')
  steps.push('Post-Survey')
  return steps
}

function getStepIndex(step: StudyStep, a: ConditionA, b: ConditionB): number {
  const labels = getStepLabels(a, b)
  const stepToLabel: Record<StudyStep, string> = {
    loading: 'Info',
    demographics: 'Info',
    pre_measure: 'Pre-Survey',
    priming: 'Priming',
    priming_compliance: 'Priming',
    goal_writing: 'Goal',
    coaching: 'Coach',
    anchoring: 'Anchor',
    post_measure: 'Post-Survey',
  }
  const idx = labels.indexOf(stepToLabel[step])
  return idx >= 0 ? idx : 0
}

export default function StudyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [step, setStep] = useState<StudyStep>('loading')
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [goalId, setGoalId] = useState<number | null>(null)
  const [goalText, setGoalText] = useState('')
  const [sessionStartAt] = useState(new Date().toISOString())

  const condA = (searchParams.get('condition_a') || searchParams.get('condA') || 'A1') as ConditionA
  const condB = (searchParams.get('condition_b') || searchParams.get('condB') || 'B1') as ConditionB
  const prolificPid = searchParams.get('PROLIFIC_PID') || searchParams.get('prolific_pid') || `test_${Date.now()}`
  const studyId = searchParams.get('STUDY_ID') || ''
  const sessionId = searchParams.get('SESSION_ID') || ''

  const hasAI = condA === 'A2'
  const hasAnchoring = condB === 'B2'

  useEffect(() => {
    api.createParticipant({
      prolific_pid: prolificPid,
      study_id: studyId,
      session_id: sessionId,
      condition_a: condA,
      condition_b: condB,
    }).then((p) => {
      setParticipant(p)
      setStep('demographics')
    }).catch((err) => {
      console.error('Failed to create participant:', err)
      setStep('demographics')
    })
  }, [])

  function updateStatus(status: string) {
    if (participant) api.updateStatus(participant.id, status)
  }

  async function handleDemographics(data: Record<string, unknown>) {
    if (participant) await api.saveDemographics(participant.id, data)
    updateStatus('pre_measure')
    setStep('pre_measure')
  }

  async function handlePreMeasure(data: Record<string, unknown>) {
    if (participant) await api.saveSurvey(participant.id, 'pre_measure', data)
    if (hasAnchoring) {
      updateStatus('priming')
      setStep('priming')
    } else {
      updateStatus('goal_writing')
      setStep('goal_writing')
    }
  }

  function handlePrimingDone() {
    setStep('priming_compliance')
  }

  async function handlePrimingCompliance(data: Record<string, unknown>) {
    if (participant) await api.saveSurvey(participant.id, 'priming_compliance', data)
    updateStatus('goal_writing')
    setStep('goal_writing')
  }

  async function handleGoalSubmit(text: string) {
    setGoalText(text)
    if (participant) {
      const { goal_id } = await api.createGoal(participant.id, text, sessionStartAt)
      setGoalId(goal_id)

      if (hasAI) {
        updateStatus('coaching')
        setStep('coaching')
      } else if (hasAnchoring) {
        await api.finalizeGoal(goal_id, text)
        updateStatus('anchoring')
        setStep('anchoring')
      } else {
        await api.finalizeGoal(goal_id, text)
        updateStatus('post_measure')
        setStep('post_measure')
      }
    }
  }

  async function handleCoachingDone(finalText: string, exitReason?: ExitReason) {
    setGoalText(finalText)
    if (goalId) await api.finalizeGoal(goalId, finalText, exitReason)
    if (hasAnchoring) {
      updateStatus('anchoring')
      setStep('anchoring')
    } else {
      updateStatus('post_measure')
      setStep('post_measure')
    }
  }

  async function handleAnchoringDone(pleasure: string, pain: string) {
    if (participant) await api.saveAnchoring(participant.id, pleasure, pain)
    updateStatus('post_measure')
    setStep('post_measure')
  }

  async function handlePostMeasure(data: Record<string, unknown>) {
    if (participant) {
      await api.saveSurvey(participant.id, 'post_measure', data)
      updateStatus('completed')
    }
    navigate(`/complete?PROLIFIC_PID=${encodeURIComponent(prolificPid)}`)
  }

  if (step === 'loading') {
    return <div className="flex items-center justify-center min-h-screen text-zinc-400">Loading...</div>
  }

  const stepLabels = getStepLabels(condA, condB)
  const currentIdx = getStepIndex(step, condA, condB)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4">
      <ProgressBar steps={stepLabels} currentStep={currentIdx} />

      {step === 'demographics' && <SurveyPage surveyJson={demographicsSurvey} onComplete={handleDemographics} />}
      {step === 'pre_measure' && <SurveyPage surveyJson={preMeasureSurvey} onComplete={handlePreMeasure} />}
      {step === 'priming' && <PrimingStep onComplete={handlePrimingDone} />}
      {step === 'priming_compliance' && <SurveyPage surveyJson={primingComplianceSurvey} onComplete={handlePrimingCompliance} />}
      {step === 'goal_writing' && <GoalWritingStep onSubmit={handleGoalSubmit} />}
      {step === 'coaching' && goalId && <AiRefinementLoop goalId={goalId} initialGoalText={goalText} onFinish={handleCoachingDone} />}
      {step === 'anchoring' && <AnchoringStep onComplete={handleAnchoringDone} />}
      {step === 'post_measure' && <SurveyPage surveyJson={buildPostMeasureSurvey(hasAI)} onComplete={handlePostMeasure} />}
    </div>
  )
}
