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
    <div className="bg-white rounded-[20px] border border-surface-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(37,99,235,0.06)]">
      <div className="p-8 sm:p-10">
        {/* Brand */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <i className="bx bxs-wallet-alt text-[40px] text-primary-600"></i>
            <span className="font-bold text-2xl tracking-tight">
              <span className="text-surface-900">BULL</span>
              <span className="text-primary-600">PAY</span>
            </span>
          </Link>
        </div>

        <h4 className="text-xl font-semibold mb-1">Check your email 📧</h4>
        <p className="text-sm text-surface-500 mb-6">
          {email
            ? <>If an account exists for <strong className="text-surface-700">{email}</strong>, a password reset link has been sent.</>
            : 'If an account exists for the provided email, a password reset link has been sent.'}
        </p>

        <div className="text-center">
          <Link href="/login" className="btn btn-primary inline-flex items-center gap-1">
            <i className="bx bx-chevron-left text-lg"></i>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
