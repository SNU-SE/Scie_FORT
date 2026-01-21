import { Routes, Route } from 'react-router-dom'

// Pages - will be implemented
import CodeEntryPage from './pages/CodeEntryPage'
import RespondentInfoPage from './pages/RespondentInfoPage'
import SurveyPage from './pages/SurveyPage'
import CompletePage from './pages/CompletePage'
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import SurveyEditPage from './pages/admin/SurveyEditPage'
import ResponsesPage from './pages/admin/ResponsesPage'

function App() {
  return (
    <Routes>
      {/* Respondent Routes */}
      <Route path="/" element={<CodeEntryPage />} />
      <Route path="/info/:code" element={<RespondentInfoPage />} />
      <Route path="/survey/:code" element={<SurveyPage />} />
      <Route path="/complete" element={<CompletePage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<LoginPage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/survey/new" element={<SurveyEditPage />} />
      <Route path="/admin/survey/:id" element={<SurveyEditPage />} />
      <Route path="/admin/survey/:id/responses" element={<ResponsesPage />} />
    </Routes>
  )
}

export default App
