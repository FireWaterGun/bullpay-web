import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import LandingPage from '../views/landing/LandingPage'
import LoginPage from '../views/auth/LoginPage'
import RegisterPage from '../views/auth/RegisterPage'
import ForgotPage from '../views/auth/ForgotPage'
import ForgotCompletePage from '../views/auth/ForgotCompletePage'
import RegisterCompletePage from '../views/auth/RegisterCompletePage'
import DashboardLayout from '../views/app/DashboardLayout'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { PusherProvider } from '../context/PusherContext'
import { ToastProvider } from '../context/ToastContext'
import InvoicePayment from '../views/invoices/InvoicePayment'
import InvoicePaymentV2 from '../views/invoices/InvoicePaymentV2'
import VerifyEmailPage from '../views/auth/VerifyEmailPage'

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isReady, isAdmin, user } = useAuth()
  
  if (!isReady) return null // or a loader
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    console.warn('[ProtectedRoute] Access denied: Admin role required', { user })
    return <Navigate to="/app" replace />
  }
  
  return children
}

function RootHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isReady } = useAuth()

  useEffect(() => {
    if (!isReady) return

    const params = new URLSearchParams(location.search || '')
    const hasVerifyParams = !!(params.get('verify_token') || params.get('token'))

    if (hasVerifyParams) {
      // Preserve the entire query string and send to /verify
      navigate({ pathname: '/verify', search: location.search }, { replace: true })
    } else if (isAuthenticated) {
      // If already logged in, go to dashboard
      navigate('/app', { replace: true })
    } else {
      // Show landing page for non-authenticated users
      navigate('/landing', { replace: true })
    }
  }, [location, navigate, isAuthenticated, isReady])

  return null
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PusherProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register-complete" element={<RegisterCompletePage />} />
              <Route path="/forgot" element={<ForgotPage />} />
              <Route path="/forgot-complete" element={<ForgotCompletePage />} />
              {/* Public payment routes (no auth required) */}
              <Route path="/pay/:id" element={<InvoicePaymentV2 />} />
              <Route path="/pay-v2/:id" element={<InvoicePayment />} />
              <Route path="/verify" element={<VerifyEmailPage />} />
              <Route path="/app/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PusherProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
