import { Routes, Route, Navigate } from 'react-router-dom'

// Pages - General Survey
import CodeEntryPage from './pages/CodeEntryPage'
import RespondentInfoPage from './pages/RespondentInfoPage'
import SurveyPage from './pages/SurveyPage'
import CompletePage from './pages/CompletePage'
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import SurveyEditPage from './pages/admin/SurveyEditPage'
import ResponsesPage from './pages/admin/ResponsesPage'

// Pages - AI Survey
import AIDashboardPage from './pages/ai/admin/AIDashboardPage'
import AISurveyEditPage from './pages/ai/admin/AISurveyEditPage'
import AIResponsesPage from './pages/ai/admin/AIResponsesPage'
import AIStudentInfoPage from './pages/ai/student/AIStudentInfoPage'
import AIChatPage from './pages/ai/student/AIChatPage'
import AICompletePage from './pages/ai/student/AICompletePage'

function App() {
  return (
    <Routes>
      {/* Student Entry - Unified (자동 판별) */}
      <Route path="/" element={<CodeEntryPage />} />

      {/* General Survey - Student Routes */}
      <Route path="/info/:code" element={<RespondentInfoPage />} />
      <Route path="/survey/:code" element={<SurveyPage />} />
      <Route path="/complete" element={<CompletePage />} />

      {/* Admin Routes - 로그인 */}
      <Route path="/admin" element={<LoginPage />} />

      {/* Admin Routes - 일반 설문 관리 */}
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/survey/new" element={<SurveyEditPage />} />
      <Route path="/admin/survey/:id" element={<SurveyEditPage />} />
      <Route path="/admin/survey/:id/responses" element={<ResponsesPage />} />

      {/* Admin Routes - AI 챗봇 설문 관리 */}
      <Route path="/admin/ai" element={<AIDashboardPage />} />
      <Route path="/admin/ai/survey/new" element={<AISurveyEditPage />} />
      <Route path="/admin/ai/survey/:id" element={<AISurveyEditPage />} />
      <Route path="/admin/ai/survey/:id/responses" element={<AIResponsesPage />} />

      {/* AI Survey - Student Routes (코드 입력 후 리다이렉트됨) */}
      <Route path="/ai" element={<Navigate to="/" replace />} />
      <Route path="/ai/:code/info" element={<AIStudentInfoPage />} />
      <Route path="/ai/:code/chat" element={<AIChatPage />} />
      <Route path="/ai/:code/complete" element={<AICompletePage />} />
    </Routes>
  )
}

export default App
