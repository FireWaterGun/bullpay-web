'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function RegisterCompletePage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('register_email')
      if (stored) {
        setEmail(stored)
        sessionStorage.removeItem('register_email')
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
        <h4 className="mb-1">Verify your email 📧</h4>
        <p className="mb-6">
          {email
            ? <>We&apos;ve sent a verification email to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.</>
            : "We've sent a verification email to the address you used. Please check your inbox and click the link to verify your account."}
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
