import type { ExitReason } from '@/lib/types'
import { Card } from './ui/Card'

interface ExitReasonModalProps {
  onSelect: (reason: ExitReason) => void
}

const OPTIONS: { value: ExitReason; label: string }[] = [
  { value: 'satisfied', label: "I'm satisfied with my goal" },
  { value: 'enough_time', label: "I've spent enough time on this" },
  { value: 'not_helpful', label: "The feedback wasn't helpful" },
  { value: 'other', label: 'Other' },
]

export function ExitReasonModal({ onSelect }: ExitReasonModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="max-w-sm w-full p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-zinc-100">Before you continue</h3>
        <p className="text-sm text-zinc-400">Why did you stop revising?</p>
        <div className="space-y-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-left text-sm text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-800 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
