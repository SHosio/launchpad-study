interface ProgressBarProps {
  steps: string[]
  currentStep: number
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="mx-auto max-w-xl mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < currentStep ? 'bg-orange-500 text-white' : i === currentStep ? 'bg-orange-500/20 text-orange-400 ring-2 ring-orange-500' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {i < currentStep ? '\u2713' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-1 h-px w-8 sm:w-12 ${i < currentStep ? 'bg-orange-500' : 'bg-zinc-700'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {steps.map((label, i) => (
          <span key={label} className={`text-[10px] ${i <= currentStep ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
