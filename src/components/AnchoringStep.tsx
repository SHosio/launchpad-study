import { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Textarea } from './ui/Textarea'

interface AnchoringStepProps {
  onComplete: (pleasureVision: string, painVision: string) => void
  autoFill?: boolean
}

export function AnchoringStep({ onComplete, autoFill }: AnchoringStepProps) {
  const [pleasure, setPleasure] = useState(autoFill ? 'I feel accomplished and proud. My certification opens new career doors and I wake up excited about the possibilities ahead. My colleagues notice the change and I feel confident in meetings.' : '')
  const [pain, setPain] = useState(autoFill ? 'Nothing changes. I stay stuck in the same role, watching others advance. The frustration of inaction weighs on me daily and I regret not starting when I had the chance.' : '')

  const canContinue = pleasure.trim().length >= 20 && pain.trim().length >= 20

  return (
    <Card className="mx-auto max-w-xl p-6 space-y-5">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-zinc-900">Emotional Anchoring</h2>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-800">The Vision</label>
        <p className="text-xs text-zinc-500">
          Imagine you've achieved this goal. What does success look and feel like? Be as vivid and specific as possible.
        </p>
        <Textarea
          value={pleasure}
          onChange={(e) => setPleasure(e.target.value)}
          placeholder="When this goal succeeds — what changes? How do you feel waking up that morning? What does the world look like?"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-800">The Cost</label>
        <p className="text-xs text-zinc-500">
          Now imagine it's five weeks from now and nothing has changed. What does staying the same cost you? What do you miss out on?
        </p>
        <Textarea
          value={pain}
          onChange={(e) => setPain(e.target.value)}
          placeholder="If you let this slide — what stays the same? What opportunities pass? How does that feel?"
          rows={4}
        />
      </div>

      <Button onClick={() => onComplete(pleasure.trim(), pain.trim())} disabled={!canContinue} className="w-full">
        Lock It In
      </Button>
    </Card>
  )
}
