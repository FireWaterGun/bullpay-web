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

        <h4 className="text-xl font-semibold mb-1">Verify your email 📧</h4>
        <p className="text-sm text-surface-500 mb-6">
          {email
            ? <>We&apos;ve sent a verification email to <strong className="text-surface-700">{email}</strong>. Please check your inbox and click the link to verify your account.</>
            : "We've sent a verification email to the address you used. Please check your inbox and click the link to verify your account."}
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
