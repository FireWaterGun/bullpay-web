'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Turnstile = dynamic(() => import('react-turnstile').then((m) => m.Turnstile), { ssr: false });
import { forgotPasswordApi } from '@/lib/api/auth';
import { Alert, Button, Input, Label } from '../../../components/ui';

export default function ForgotPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

   
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await forgotPasswordApi({ email, cfToken });
      try {sessionStorage.setItem('forgot_email', email);} catch {}
      router.replace('/forgot-complete');
       
    } catch (err: any) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {};
      setFieldErrors(details);
      let display = '';
      if (typeof err?.message === 'string') display = err.message;else
      if (typeof err?.data?.error?.message === 'string') display = err.data.error.message;else
      if (typeof err?.data?.message === 'string') display = err.data.message;
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length) display = details.cfToken[0];
      setError(display || 'Request failed');
      setCfToken('');
      setCaptchaRenderKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const emailInvalid = Array.isArray(fieldErrors.email) && fieldErrors.email.length > 0;
  const captchaInvalid = Array.isArray(fieldErrors.cfToken) && fieldErrors.cfToken.length > 0;

  return (
    <div className="bg-card rounded-[20px] border border-surface-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(37,99,235,0.06)]">
      <div className="p-8 sm:p-10">
        {/* Brand */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <i className="bx bxs-wallet-alt text-2xl text-primary-600"></i>
            <span className="font-bold text-2xl tracking-tight">
              <span className="text-surface-900">BULL</span>
              <span className="text-primary-600">PAY</span>
            </span>
          </Link>
        </div>

        <h4 className="text-xl font-semibold mb-1">Forgot Password? 🔒</h4>
        <p className="text-sm text-surface-500 mb-6">
          Enter your email and we&apos;ll send you instructions to reset your password
        </p>

        {error && <Alert className="mb-4">{error}</Alert>}

        <form className="space-y-5" onSubmit={onSubmit}>
          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="text"

              id="email"
              name="email"
              placeholder="Enter your email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailInvalid} error={emailInvalid} />
            
            {emailInvalid &&
            <p className="mt-1 text-sm text-danger-500">{fieldErrors.email[0]}</p>
            }
          </div>

          {/* Captcha */}
          <div>
            {siteKey &&
            <div className="rounded-[10px] overflow-hidden">
                <Turnstile
                key={captchaRenderKey}
                sitekey={siteKey}
                theme="light"
                appearance="always"
                size="flexible"
                onVerify={(token) => setCfToken(token)}
                onError={() => setError('CAPTCHA failed, please try again')}
                onExpire={() => setCfToken('')} />
              
              </div>
            }
            {captchaInvalid &&
            <p className="mt-2 text-sm text-danger-500">CAPTCHA: {fieldErrors.cfToken[0]}</p>
            }
          </div>

          {/* Submit */}
          <Button

            type="submit"
            disabled={loading || !cfToken} className="w-full">
            
            {loading ? 'Submitting...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium">
            <i className="bx bx-chevron-left text-lg"></i>
            Back to login
          </Link>
        </div>
      </div>
    </div>);

}