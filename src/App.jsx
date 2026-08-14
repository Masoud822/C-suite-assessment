import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import AssessmentRegistrationPage from './pages/AssessmentRegistrationPage'
import AssessmentQuestionPage from './pages/AssessmentQuestionPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminLoginPage from './pages/AdminLoginPage'
import GuestRoute from './components/GuestRoute'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route 
            path="assessment/register" 
            element={
              <GuestRoute>
                <AssessmentRegistrationPage />
              </GuestRoute>
            } 
          />
          <Route path="assessment/question" element={<AssessmentQuestionPage />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/login" element={<AdminLoginPage />} />
          {/* Catch-all fallback directly to Home Landing Page to prevent 404 screen */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
