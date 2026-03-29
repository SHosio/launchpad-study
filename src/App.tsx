import { Routes, Route } from 'react-router-dom'
import StudyPage from './pages/StudyPage'
import FollowupPage from './pages/FollowupPage'
import CompletePage from './pages/CompletePage'
import TestPage from './pages/TestPage'

function App() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Routes>
        <Route path="/test" element={<TestPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/followup" element={<FollowupPage />} />
        <Route path="/complete" element={<CompletePage />} />
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen text-zinc-600 text-sm">
            This is a research instrument. Please use the link provided by Prolific.
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
