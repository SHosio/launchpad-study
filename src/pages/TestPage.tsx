import { useState } from 'react'
import { ALL_VARIANTS, getVariantCode } from '@/lib/conditions'

const CONDITIONS = [
  { a: 'A1' as const, b: 'B1' as const, label: 'Control', desc: 'No AI, No Anchoring' },
  { a: 'A2' as const, b: 'B1' as const, label: 'AI Only', desc: 'AI Coach, No Anchoring' },
  { a: 'A1' as const, b: 'B2' as const, label: 'Anchoring Only', desc: 'No AI, Anchoring' },
  { a: 'A2' as const, b: 'B2' as const, label: 'Full Treatment', desc: 'AI Coach + Anchoring' },
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
    <div className="min-h-screen bg-white text-zinc-900 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-zinc-900">Test Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-2">Dev/testing links for all study conditions</p>
        </div>

        {/* Prolific setup guide */}
        <div className="rounded-xl border border-zinc-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">Prolific Setup</h2>
          <p className="text-xs text-zinc-600">
            This study uses <strong>one Prolific study</strong> with server-side balanced randomization.
            The server assigns each participant to the cell with fewest active participants. Prolific auto-appends <code className="text-orange-600 bg-orange-50 px-1 rounded">PROLIFIC_PID</code>, <code className="text-orange-600 bg-orange-50 px-1 rounded">STUDY_ID</code>, and <code className="text-orange-600 bg-orange-50 px-1 rounded">SESSION_ID</code>.
          </p>
          <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-2 text-xs font-mono text-zinc-700">
            <p className="text-zinc-400"># Prolific study URL (single study, auto-randomized):</p>
            <p className="text-zinc-800">{'https://<your-domain>/study'}</p>
            <p className="text-zinc-400 mt-2"># Manual override URLs (for testing specific conditions):</p>
            {CONDITIONS.map((c) => (
              <p key={`${c.a}-${c.b}`}>
                <span className="text-zinc-400">{c.label}:</span>{' '}
                <span className="text-zinc-800">{'https://<your-domain>/study?v='}{getVariantCode(c.a, c.b)}</span>
              </p>
            ))}
          </div>
          <div className="text-xs text-zinc-600 space-y-1">
            <p><strong>Prolific study config:</strong></p>
            <ol className="list-decimal list-inside space-y-0.5 text-zinc-500">
              <li>Set the study URL to <code className="text-zinc-800 bg-zinc-100 px-1 rounded">{'https://<your-domain>/study'}</code> — no condition params needed</li>
              <li>Under "Data collection" enable URL parameters: Prolific adds <code className="text-orange-600 bg-orange-50 px-1 rounded">{'{{%PROLIFIC_PID%}}'}</code>, <code className="text-orange-600 bg-orange-50 px-1 rounded">{'{{%STUDY_ID%}}'}</code>, <code className="text-orange-600 bg-orange-50 px-1 rounded">{'{{%SESSION_ID%}}'}</code> automatically</li>
              <li>Set the completion code in <code className="text-orange-600 bg-orange-50 px-1 rounded">CompletePage.tsx</code> (replace <code>STUDY_COMPLETION_CODE</code>)</li>
              <li>The follow-up is a <strong>separate Prolific study</strong> — use URL: <code className="text-zinc-800 bg-zinc-100 px-1 rounded">{'https://<your-domain>/followup'}</code> (participants matched by PROLIFIC_PID)</li>
            </ol>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Randomization:</strong> Server auto-assigns to the least-populated active cell. Abandoned sessions (&gt;45 min, not completed) free up their slot. Use <code>v</code> param to override for testing.
            {ALL_VARIANTS.map((v) => (
              <span key={v.code} className="ml-2 font-mono">{v.code}={v.a}×{v.b}</span>
            ))}
          </div>
        </div>

        {/* Study conditions */}
        <div className="rounded-xl border border-zinc-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Study Sessions</h2>
          <p className="text-xs text-zinc-500">Each link creates a new test participant with a unique Prolific PID. Use these to walk through each condition.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONDITIONS.map((c) => {
              const code = getVariantCode(c.a, c.b)
              return (
                <a
                  key={`${c.a}-${c.b}`}
                  href={`/study?PROLIFIC_PID=${pid}_${c.a}${c.b}&v=${code}`}
                  className="block rounded-lg border border-zinc-200 p-4 hover:border-orange-400 hover:bg-orange-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900">{c.label}</span>
                    <span className="text-xs font-mono text-zinc-400">{c.a} × {c.b}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{c.desc}</p>
                  <p className="text-[10px] font-mono text-zinc-400 mt-1">v={code}</p>
                </a>
              )
            })}
          </div>
        </div>

        {/* Follow-up */}
        <div className="rounded-xl border border-zinc-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Follow-up Survey</h2>
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
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Open
            </button>
          </form>
        </div>

        {/* Admin tools */}
        <div className="rounded-xl border border-red-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-red-600">Admin Tools</h2>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleStats}
              className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              View Stats
            </button>
            <a
              href={adminPassword ? `/api/admin/dash?password=${encodeURIComponent(adminPassword)}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => { if (!adminPassword) e.preventDefault() }}
              className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Dashboard
            </a>
            <a
              href={adminPassword ? `/api/admin/export?password=${encodeURIComponent(adminPassword)}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => { if (!adminPassword) e.preventDefault() }}
              className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Export JSON
            </a>
            <a
              href={adminPassword ? `/api/admin/download-db?password=${encodeURIComponent(adminPassword)}` : undefined}
              onClick={(e) => { if (!adminPassword) e.preventDefault() }}
              className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Download DB
            </a>
            <button
              onClick={handleReset}
              className="rounded-lg bg-red-50 border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Delete All Data
            </button>
          </div>

          {stats && (
            <pre className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700 overflow-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          )}
          {resetStatus && (
            <p className={`text-xs ${resetStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {resetStatus}
            </p>
          )}
        </div>

        {/* Goal Rating Task */}
        <div className="rounded-xl border border-blue-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-blue-600">Goal Rating Task</h2>
          <p className="text-xs text-zinc-500">Human quality ratings for goal texts. Seed batches first, then send raters via Prolific.</p>

          <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-2 text-xs font-mono text-zinc-700">
            <p className="text-zinc-400"># Prolific URL for raters:</p>
            <p className="text-zinc-800">{'https://<your-domain>/rate?PROLIFIC_PID={{%PROLIFIC_PID%}}'}</p>
            <p className="text-zinc-400 mt-2"># Test locally:</p>
            <p className="text-zinc-800">{'http://localhost:3000/rate?PROLIFIC_PID=test_rater_1'}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                if (!adminPassword) return
                try {
                  const res = await fetch(`/api/rating/seed?password=${encodeURIComponent(adminPassword)}&version=final`, { method: 'POST' })
                  const data = await res.json()
                  setResetStatus(res.ok ? `Seeded: ${JSON.stringify(data)}` : `Error: ${data.error}`)
                } catch (err) { setResetStatus(`Error: ${err}`) }
              }}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Seed Final Goal Batches
            </button>
            <button
              onClick={async () => {
                if (!adminPassword) return
                try {
                  const res = await fetch(`/api/rating/seed?password=${encodeURIComponent(adminPassword)}&version=initial`, { method: 'POST' })
                  const data = await res.json()
                  setResetStatus(res.ok ? `Seeded: ${JSON.stringify(data)}` : `Error: ${data.error}`)
                } catch (err) { setResetStatus(`Error: ${err}`) }
              }}
              className="rounded-lg bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Seed Initial Goal Batches (A2)
            </button>
            <a
              href={adminPassword ? `/api/rating/status?password=${encodeURIComponent(adminPassword)}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => { if (!adminPassword) e.preventDefault() }}
              className="rounded-lg bg-zinc-800 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Rating Status
            </a>
            <button
              onClick={async () => {
                if (!adminPassword) return
                if (!confirm('Delete ALL rating data (batches, raters, ratings)? This cannot be undone.')) return
                try {
                  const res = await fetch(`/api/rating/reset?password=${encodeURIComponent(adminPassword)}`, { method: 'POST' })
                  const data = await res.json()
                  setResetStatus(res.ok ? `Deleted rating data: ${JSON.stringify(data)}` : `Error: ${data.error}`)
                } catch (err) { setResetStatus(`Error: ${err}`) }
              }}
              className="rounded-lg bg-red-50 border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Delete Rating Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
