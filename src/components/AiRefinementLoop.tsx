import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { GoalCoachResult, ExitReason } from '@/lib/types'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Textarea } from './ui/Textarea'
import { ExitReasonModal } from './ExitReasonModal'

interface AiRefinementLoopProps {
  goalId: number
  initialGoalText: string
  onFinish: (finalGoalText: string, exitReason?: ExitReason) => void
}

const DIMENSION_LABELS: Record<string, string> = {
  specific: 'Spec',
  measurable: 'Meas',
  achievable: 'Achi',
  relevant: 'Rele',
  timeBound: 'Time',
}

export function AiRefinementLoop({ goalId, initialGoalText, onFinish }: AiRefinementLoopProps) {
  const [goalText, setGoalText] = useState(initialGoalText)
  const [result, setResult] = useState<GoalCoachResult | null>(null)
  const [previousFeedback, setPreviousFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  useEffect(() => {
    evaluate(initialGoalText, null)
  }, [])

  async function evaluate(text: string, prevFeedback: string | null) {
    setLoading(true)
    try {
      const res = await api.getGoalCoachFeedback(goalId, text, prevFeedback)
      setResult(res)
      setPreviousFeedback(res.feedback)
    } catch (err) {
      console.error('AI coaching error:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleRefine() {
    evaluate(goalText, previousFeedback)
  }

  function handleSkip() {
    if (result?.overall === 'strong') {
      onFinish(goalText)
    } else {
      setShowExitModal(true)
    }
  }

  function handleExitReason(reason: ExitReason) {
    setShowExitModal(false)
    onFinish(goalText, reason)
  }

  return (
    <>
      <Card className="mx-auto max-w-xl p-6 space-y-4">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-zinc-100">AI Coaching</h2>
        </div>

        {loading && !result && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <span className="ml-2 text-sm text-zinc-400">Evaluating your goal...</span>
          </div>
        )}

        {result && (
          <>
            <div className="grid grid-cols-5 gap-1.5">
              {(['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as const).map((dim) => {
                const rating = result.dimensions[dim].rating
                const color =
                  rating === 'strong'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : rating === 'okay'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                return (
                  <div key={dim} className={`rounded-lg border p-2 text-center ${color}`} title={result.dimensions[dim].note}>
                    <p className="text-[10px] font-medium uppercase tracking-wider">{DIMENSION_LABELS[dim]}</p>
                    <p className="text-xs font-bold mt-0.5">{rating}</p>
                  </div>
                )
              })}
            </div>

            <div className="rounded-lg bg-zinc-800/50 p-4 space-y-2">
              <p className="text-sm text-zinc-200">{result.feedback}</p>
              {result.overall !== 'strong' && result.suggestion && (
                <p className="text-sm text-orange-400 font-medium">{result.suggestion}</p>
              )}
            </div>

            <Textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} rows={5} />

            <Button onClick={handleRefine} disabled={loading} className="w-full">
              {loading ? 'Checking...' : 'Check Again'}
            </Button>
            <button
              onClick={handleSkip}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
            >
              {result.overall === 'strong' ? 'Continue \u2192' : 'This is good enough'}
            </button>
          </>
        )}
      </Card>

      {showExitModal && <ExitReasonModal onSelect={handleExitReason} />}
    </>
  )
}
