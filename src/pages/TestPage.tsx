import { useState } from 'react'
import { Card } from '@/components/ui/Card'

const CONDITIONS = [
  { a: 'A1', b: 'B1', label: 'Control', desc: 'No AI, No Anchoring' },
  { a: 'A2', b: 'B1', label: 'AI Only', desc: 'AI Coach, No Anchoring' },
  { a: 'A1', b: 'B2', label: 'Anchoring Only', desc: 'No AI, Anchoring' },
  { a: 'A2', b: 'B2', label: 'Full Treatment', desc: 'AI Coach + Anchoring' },
]

export default function TestPage() {
  const [adminPassword, setAdminPassword] = useState('')
  const [resetStatus, setResetStatus] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)

  const pid = `test_${Date.now()}`

  async function handleReset() {
    if (!adminPassword) return
    if (!confirm('Delete ALL participant data? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/reset?password=${encodeURIComponent(adminPassword)}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResetStatus(`Deleted: ${data.deleted.participants} participants, ${data.deleted.goals} goals, ${data.deleted.refinement_rounds} rounds, ${data.deleted.surveys} surveys, ${data.deleted.anchoring} anchoring, ${data.deleted.followups} followups`)
        setStats(null)
      } else {
        setResetStatus(`Error: ${data.error}`)
      }
    } catch (err) {
      setResetStatus(`Error: ${err}`)
    }
  }

  async function handleStats() {
    if (!adminPassword) return
    try {
      const res = await fetch(`/api/admin/stats?password=${encodeURIComponent(adminPassword)}`)
      const data = await res.json()
      if (res.ok) setStats(data)
      else setResetStatus(`Error: ${data.error}`)
    } catch (err) {
      setResetStatus(`Error: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Test Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-2">Dev/testing links for all study conditions</p>
        </div>

        {/* Prolific setup guide */}
        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Prolific Setup</h2>
          <p className="text-xs text-zinc-400">
            This study uses <strong>4 separate Prolific studies</strong> (one per cell). Each study URL bakes in the condition assignment.
            Prolific auto-appends <code className="text-orange-400">PROLIFIC_PID</code>, <code className="text-orange-400">STUDY_ID</code>, and <code className="text-orange-400">SESSION_ID</code> as URL params.
          </p>
          <div className="rounded-lg bg-zinc-800 p-3 space-y-2 text-xs font-mono text-zinc-300">
            <p className="text-zinc-500"># Prolific study URLs (one per cell):</p>
            {CONDITIONS.map((c) => (
              <p key={`${c.a}-${c.b}`}>
                <span className="text-zinc-500">{c.label}:</span>{' '}
                {'https://<your-domain>/study?condition_a='}{c.a}{'&condition_b='}{c.b}
              </p>
            ))}
          </div>
          <div className="text-xs text-zinc-400 space-y-1">
            <p><strong>In each Prolific study config:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5 text-zinc-500">
              <li>Set the study URL to the matching line above</li>
              <li>Under "Data collection" enable URL parameters: Prolific adds <code className="text-orange-400">{'{{%PROLIFIC_PID%}}'}</code>, <code className="text-orange-400">{'{{%STUDY_ID%}}'}</code>, <code className="text-orange-400">{'{{%SESSION_ID%}}'}</code> automatically</li>
              <li>Set the completion code in <code className="text-orange-400">CompletePage.tsx</code> (replace <code>STUDY_COMPLETION_CODE</code>)</li>
              <li>The follow-up is a <strong>separate Prolific study</strong> — use URL: <code className="text-zinc-300">{'https://<your-domain>/followup'}</code> (participants matched by PROLIFIC_PID)</li>
            </ol>
          </div>
        </Card>

        {/* Study conditions */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Study Sessions</h2>
          <p className="text-xs text-zinc-500">Each link creates a new test participant with a unique Prolific PID. Use these to walk through each condition.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONDITIONS.map((c) => (
              <a
                key={`${c.a}-${c.b}`}
                href={`/study?PROLIFIC_PID=${pid}_${c.a}${c.b}&condition_a=${c.a}&condition_b=${c.b}`}
                className="block rounded-lg border border-zinc-700 p-4 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-100">{c.label}</span>
                  <span className="text-xs font-mono text-zinc-500">{c.a} x {c.b}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{c.desc}</p>
              </a>
            ))}
          </div>
        </Card>

        {/* Follow-up */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Follow-up Survey</h2>
          <p className="text-xs text-zinc-500">Requires a participant who completed the main session. Enter their Prolific PID below.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const fpid = (form.elements.namedItem('fpid') as HTMLInputElement).value
              if (fpid) window.location.href = `/followup?PROLIFIC_PID=${encodeURIComponent(fpid)}`
            }}
            className="flex gap-2"
          >
            <input
              name="fpid"
              type="text"
              placeholder="PROLIFIC_PID of completed participant"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-600 transition-colors"
            >
              Open
            </button>
          </form>
        </Card>

        {/* Admin tools */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-red-400">Admin Tools</h2>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStats}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-600 transition-colors"
            >
              View Stats
            </button>
            <a
              href={adminPassword ? `/api/admin/export?password=${encodeURIComponent(adminPassword)}` : '#'}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-600 transition-colors"
            >
              Export JSON
            </a>
            <button
              onClick={handleReset}
              className="rounded-lg bg-red-900/50 border border-red-700 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-900 transition-colors"
            >
              Delete All Data
            </button>
          </div>

          {stats && (
            <pre className="rounded-lg bg-zinc-800 p-3 text-xs text-zinc-300 overflow-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          )}
          {resetStatus && (
            <p className={`text-xs ${resetStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {resetStatus}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
