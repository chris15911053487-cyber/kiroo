import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AssessmentProvider, useAssessment } from './context/AssessmentContext'
import { AuthProvider } from './context/AuthContext'
import { loadQuestionnaires } from './lib/questionnaireLoader'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HelloPage from './pages/HelloPage'
import SelectQuestionnairePage from './pages/SelectQuestionnairePage'
import QuizPage from './pages/QuizPage'
import TransitionPage from './pages/TransitionPage'
import SubmittedPage from './pages/SubmittedPage'
import ReportPage from './pages/ReportPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import BottomNav from './components/BottomNav'
import NotFoundPage from './pages/NotFoundPage'

function AppInitializer() {
  const { dispatch } = useAssessment()

  useEffect(() => {
    const questionnaires = loadQuestionnaires()
    dispatch({ type: 'SET_QUESTIONNAIRES', payload: questionnaires })
  }, [dispatch])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <BrowserRouter>
          <AppInitializer />
          <Navbar />
          <Routes>
            {/* 新版路由 */}
            <Route path="/" element={<HelloPage />} />
            <Route path="/select" element={<ProtectedRoute><SelectQuestionnairePage /></ProtectedRoute>} />
            <Route path="/quiz/:sessionId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/quiz/:sessionId/transition" element={<ProtectedRoute><TransitionPage /></ProtectedRoute>} />
            <Route path="/submitted" element={<ProtectedRoute><SubmittedPage /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

            {/* 保留路由 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* 管理后台 */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </AssessmentProvider>
    </AuthProvider>
  )
}
