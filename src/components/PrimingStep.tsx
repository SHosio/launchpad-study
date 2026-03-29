import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface PrimingStepProps {
  onComplete: () => void
}

export function PrimingStep({ onComplete }: PrimingStepProps) {
  const [secondsLeft, setSecondsLeft] = useState(90)
  const timerDone = secondsLeft <= 0

  useEffect(() => {
    if (secondsLeft <= 0) return
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <Card className="mx-auto max-w-xl p-6 space-y-5">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-zinc-100">Get Into the Zone</h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          Before you set your goal, take a moment to get into an energized, focused state.
          You might listen to a song that fires you up, do 30 seconds of physical movement,
          take a few deep breaths, or simply close your eyes and think about why this goal matters to you.
        </p>
        <p className="text-sm text-zinc-400 mt-2">Take at least 90 seconds.</p>
      </div>

      <div className="text-center">
        <div className={`inline-flex items-center justify-center rounded-full h-20 w-20 text-2xl font-mono font-bold ${timerDone ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-300'}`}>
          {timerDone ? '\u2713' : `${mins}:${secs.toString().padStart(2, '0')}`}
        </div>
      </div>

      <Button onClick={onComplete} disabled={!timerDone} className="w-full">
        {timerDone ? "I'm Ready \u2014 Let's Go" : 'Please wait...'}
      </Button>
    </Card>
  )
}
