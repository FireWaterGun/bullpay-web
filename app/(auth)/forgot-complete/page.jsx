'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ForgotCompletePage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('forgot_email')
      if (stored) {
        setEmail(stored)
        sessionStorage.removeItem('forgot_email')
      }
    } catch {}
  }, [])

  return (
    <div className="card px-sm-6 px-0">
      <div className="card-body">
        <div className="app-brand justify-content-center mb-4">
          <Link href="/" className="app-brand-link gap-2 d-flex align-items-center">
            <div className="brand-icon">
              <i className="bx bxs-wallet-alt text-primary" style={{ fontSize: '40px' }}></i>
            </div>
            <span className="fw-bold" style={{ fontSize: '24px' }}>
              <span className="text-dark">BULL</span>
              <span className="text-primary">PAY</span>
            </span>
          </Link>
        </div>
        <h4 className="mb-1">Check your email 📧</h4>
        <p className="mb-6">
          {email
            ? <>If an account exists for <strong>{email}</strong>, a password reset link has been sent.</>
            : 'If an account exists for the provided email, a password reset link has been sent.'}
        </p>
        <div className="text-center">
          <Link href="/login" className="btn btn-primary d-inline-flex align-items-center">
            <i className="icon-base bx bx-chevron-left scaleX-n1-rtl me-1"></i>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
