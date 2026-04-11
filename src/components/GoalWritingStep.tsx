import { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Textarea } from './ui/Textarea'

interface GoalWritingStepProps {
  onSubmit: (goalText: string) => void
  autoFill?: boolean
}

const TEST_GOALS = [
  'Complete my AWS Solutions Architect certification by May 15, 2026 by studying 2 hours daily and passing the practice exam with 85% or higher by May 1.',
  'Write and submit a 5000-word research paper on sustainable computing to the ACM Computing Surveys journal by June 1, 2026.',
  'Launch my personal portfolio website with 5 project case studies by April 30, 2026, dedicating 10 hours per week to design and development.',
]

export function GoalWritingStep({ onSubmit, autoFill }: GoalWritingStepProps) {
  const [goalText, setGoalText] = useState(
    autoFill ? TEST_GOALS[Math.floor(Math.random() * TEST_GOALS.length)] : ''
  )

  return (
    <Card className="mx-auto max-w-xl p-6 space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-zinc-900">Write Your Goal</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Think of a specific professional or personal development goal you want to achieve in the next 4-5 weeks.
        </p>
      </div>

      <Textarea
        value={goalText}
        onChange={(e) => setGoalText(e.target.value)}
        placeholder={'Examples:\n• "Complete a professional certification course by the end of June"\n• "Finish the first draft of my thesis chapter in the next 3 weeks"\n\nNow write yours — what will you achieve, how will you know it\'s done, why does it matter, and by when?'}
        rows={7}
        autoFocus
      />

      <p className="text-xs text-zinc-500">
        A strong goal is <strong className="text-zinc-700">Specific</strong> (what exactly?),{' '}
        <strong className="text-zinc-700">Measurable</strong> (how will you know?),{' '}
        <strong className="text-zinc-700">Achievable</strong> (realistic stretch?),{' '}
        <strong className="text-zinc-700">Relevant</strong> (why does it matter?),{' '}
        and <strong className="text-zinc-700">Time-bound</strong> (by when?).
      </p>

      <Button onClick={() => onSubmit(goalText.trim())} disabled={goalText.trim().length < 10} className="w-full">
        Here's My Goal
      </Button>
    </Card>
  )
}
