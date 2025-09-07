import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from '../views/auth/LoginPage'
import RegisterPage from '../views/auth/RegisterPage'
import ForgotPage from '../views/auth/ForgotPage'
import ForgotCompletePage from '../views/auth/ForgotCompletePage'
import RegisterCompletePage from '../views/auth/RegisterCompletePage'
import DashboardLayout from '../views/app/DashboardLayout'
import { AuthProvider, useAuth } from '../context/AuthContext'
import InvoicePayment from '../views/invoices/InvoicePayment'
import VerifyEmailPage from '../views/auth/VerifyEmailPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth()
  if (!isReady) return null // or a loader
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function RootHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const hasVerifyParams = !!(params.get('verify_token') || params.get('token'))
    if (hasVerifyParams) {
      // Preserve the entire query string and send to /verify
      navigate({ pathname: '/verify', search: location.search }, { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [location, navigate])
  return null
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootHandler />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-complete" element={<RegisterCompletePage />} />
          <Route path="/forgot" element={<ForgotPage />} />
          <Route path="/forgot-complete" element={<ForgotCompletePage />} />
          {/* Public payment route (no auth required) */}
          <Route path="/pay/:id" element={<InvoicePayment />} />
          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/app/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
