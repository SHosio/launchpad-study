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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!prolificPid) {
      setError('Missing Prolific ID.')
      return
    }
    api.lookupParticipant(prolificPid).then((p) => {
      if (!p) setError('We could not find your original session. Please contact the researcher.')
      else setParticipant(p)
    })
  }, [prolificPid])

  async function handleComplete(data: Record<string, unknown>) {
    if (participant) {
      await api.saveFollowup(participant.id, data)
    }
    navigate(`/complete?PROLIFIC_PID=${encodeURIComponent(prolificPid)}`)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4">
        <Card className="max-w-md p-8 text-center">
          <p className="text-zinc-400">{error}</p>
        </Card>
      </div>
    )
  }

  if (!participant) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-400">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4">
      <SurveyPage surveyJson={followupSurvey} onComplete={handleComplete} title="One-Week Follow-Up" />
    </div>
  )
}
