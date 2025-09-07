import { Link, useLocation } from 'react-router-dom'

export default function ForgotCompletePage() {
  const location = useLocation()
  const email = location?.state?.email || ''

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card px-sm-6 px-0">
            <div className="card-body">
              <div className="app-brand justify-content-center">
                <a href="#" className="app-brand-link gap-2"><span className="app-brand-text demo text-heading fw-bold">Bull Pay</span></a>
              </div>
              <h4 className="mb-1">Check your email 📧</h4>
              <p className="mb-6">
                {email
                  ? <>If an account exists for <strong>{email}</strong>, a password reset link has been sent.</>
                  : 'If an account exists for the provided email, a password reset link has been sent.'}
              </p>
              <div className="text-center">
                <Link to="/login" className="btn btn-primary d-inline-flex align-items-center">
                  <i className="icon-base bx bx-chevron-left scaleX-n1-rtl me-1"></i>
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
