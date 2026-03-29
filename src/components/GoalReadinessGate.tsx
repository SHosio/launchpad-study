import { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface GoalReadinessGateProps {
  onReady: () => void
}

export function GoalReadinessGate({ onReady }: GoalReadinessGateProps) {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <Card className="mx-auto max-w-2xl p-8 space-y-6">
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold text-zinc-900 text-center">
          Before You Begin
        </h2>
        <p className="text-zinc-700 leading-relaxed">
          In the next step, you will be asked to write down a specific academic or professional goal
          you want to achieve in the <strong>next 4–5 weeks</strong>.
        </p>
        <p className="text-zinc-700 leading-relaxed">
          Take a moment to think about what that goal might be. Everyone has something they are working
          toward — it could be finishing a paper draft, completing a chapter, preparing a grant
          application, learning a new method, or making progress on a research project. Big or small,
          what matters is that it is real and meaningful to you.
        </p>
        <p className="text-zinc-600 text-sm italic">
          There are no wrong answers. We just need you to have a specific goal in mind before you continue.
        </p>
      </div>

      <div className="border-t border-zinc-200 pt-5 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-zinc-800 text-sm">
            I have a specific goal in mind and I am ready to continue.
          </span>
        </label>

        <Button onClick={onReady} disabled={!confirmed} className="w-full">
          Continue
        </Button>
      </div>
    </Card>
  )
}
