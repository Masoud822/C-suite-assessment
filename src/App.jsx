import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import AssessmentRegistrationPage from './pages/AssessmentRegistrationPage'
import AssessmentQuestionPage from './pages/AssessmentQuestionPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminLoginPage from './pages/AdminLoginPage'
import NotFoundPage from './pages/NotFoundPage'
import GuestRoute from './components/GuestRoute'

function App() {
  return (
    <HashRouter>
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
