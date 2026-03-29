import { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Textarea } from './ui/Textarea'

interface GoalWritingStepProps {
  onSubmit: (goalText: string) => void
}

export function GoalWritingStep({ onSubmit }: GoalWritingStepProps) {
  const [goalText, setGoalText] = useState('')

  return (
    <Card className="mx-auto max-w-xl p-6 space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-zinc-900">Write Your Goal</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Think of a specific academic or professional goal you want to achieve in the next 4-5 weeks.
        </p>
      </div>

      <Textarea
        value={goalText}
        onChange={(e) => setGoalText(e.target.value)}
        placeholder={'Example: "I will complete a full draft of my thesis introduction chapter by April 30th. Done means a coherent 3000-word draft shared with my supervisor. This matters because my committee meeting is in May and I need to show writing progress."\n\nNow write yours — what will you achieve, how will you know it\'s done, why does it matter, and by when?'}
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
