import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'
import DashboardLayout from '../views/app/DashboardLayout'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { PusherProvider } from '../context/PusherContext'
import { ToastProvider } from '../context/ToastContext'
// Public pages (lazy — only loaded when needed)
const LandingPage = lazy(() => import('../views/landing/LandingPage'))
const LoginPage = lazy(() => import('../views/auth/LoginPage'))
const RegisterPage = lazy(() => import('../views/auth/RegisterPage'))
const ForgotPage = lazy(() => import('../views/auth/ForgotPage'))
const ForgotCompletePage = lazy(() => import('../views/auth/ForgotCompletePage'))
const RegisterCompletePage = lazy(() => import('../views/auth/RegisterCompletePage'))
const VerifyEmailPage = lazy(() => import('../views/auth/VerifyEmailPage'))
const InvoicePayment = lazy(() => import('../views/invoices/InvoicePayment'))
const InvoicePaymentV2 = lazy(() => import('../views/invoices/InvoicePaymentV2'))
const PaySelect = lazy(() => import('../views/invoices/PaySelect'))

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isReady, isAdmin, user } = useAuth()
  
  if (!isReady) return null // or a loader
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    console.warn('[ProtectedRoute] Access denied: Admin role required', { user })
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function RootHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isReady, isAdmin } = useAuth()

  useEffect(() => {
    if (!isReady) return

    const params = new URLSearchParams(location.search || '')
    const hasVerifyParams = !!(params.get('verify_token') || params.get('token'))

    if (hasVerifyParams) {
      // Preserve the entire query string and send to /verify
      navigate({ pathname: '/verify', search: location.search }, { replace: true })
    } else if (isAuthenticated) {
      // Redirect to appropriate dashboard based on role
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } else {
      // Show landing page for non-authenticated users
      navigate('/landing', { replace: true })
    }
  }, [location, navigate, isAuthenticated, isReady, isAdmin])

  return null
}

export default function AppRouter() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <PusherProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<RootHandler />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register-complete" element={<RegisterCompletePage />} />
              <Route path="/forgot" element={<ForgotPage />} />
              <Route path="/forgot-complete" element={<ForgotCompletePage />} />
              {/* Public payment routes (no auth required) */}
              <Route path="/pay-select/:code" element={<PaySelect />} />
              <Route path="/pay/:id" element={<InvoicePaymentV2 />} />
              <Route path="/pay-v2/:id" element={<InvoicePayment />} />
              <Route path="/verify" element={<VerifyEmailPage />} />
              {/* API Documentation - Redirect to standalone Swagger UI */}
              <Route path="/api-docs" element={<Navigate to="/swagger-ui.html" replace />} />
              {/* Protected routes — single DashboardLayout instance handles all authenticated paths */}
              <Route path="/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </PusherProvider>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}
