import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Participant } from '@/lib/types'
import { SurveyPage } from '@/components/SurveyPage'
import { Card } from '@/components/ui/Card'
import { followupSurvey } from '@/surveys/followup-survey'

export default function FollowupPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const prolificPid = searchParams.get('PROLIFIC_PID') || ''
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [goalText, setGoalText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!prolificPid) {
      setError('Missing Prolific ID.')
      return
    }
    api.lookupParticipant(prolificPid).then(async (p) => {
      if (!p) {
        setError('We could not find your original session. Please contact the researcher.')
        return
      }
      setParticipant(p)
      try {
        const { goal_text } = await api.getParticipantGoal(p.id)
        setGoalText(goal_text)
      } catch {
        setGoalText('(Could not retrieve your goal)')
      }
    })
  }, [prolificPid])

  function handleSurveyAfterRender() {
    // Inject the original goal text into the HTML element on the recognition page
    if (goalText) {
      const el = document.getElementById('original-goal-display')
      if (el) el.textContent = goalText
    }
  }

  async function handleComplete(data: Record<string, unknown>) {
    if (participant) {
      await api.saveFollowup(participant.id, data)
    }
    navigate(`/complete?PROLIFIC_PID=${encodeURIComponent(prolificPid)}`)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white px-4">
        <Card className="max-w-md p-8 text-center">
          <p className="text-zinc-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (!participant || goalText === null) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 py-8 px-4">
      <SurveyPage
        surveyJson={followupSurvey}
        onComplete={handleComplete}
        title="One-Week Follow-Up"
        onCurrentPageChanged={handleSurveyAfterRender}
      />
    </div>
  )
}
