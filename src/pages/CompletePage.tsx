import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

export default function CompletePage() {
  const [searchParams] = useSearchParams()
  const prolificPid = searchParams.get('PROLIFIC_PID') || ''

  // Replace STUDY_COMPLETION_CODE with your actual Prolific completion code
  const prolificRedirect = `https://app.prolific.com/submissions/complete?cc=STUDY_COMPLETION_CODE`

  return (
    <div className="flex items-center justify-center min-h-screen bg-white text-zinc-900 px-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Thank You!</h1>
        <p className="text-sm text-zinc-600">
          Your responses have been recorded. You may be invited to a brief follow-up survey in one week.
        </p>
        <a
          href={prolificRedirect}
          className="inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          Return to Prolific
        </a>
        <p className="text-xs text-zinc-400">Participant: {prolificPid}</p>
      </Card>
    </div>
  )
}
