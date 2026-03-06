'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '@/app/providers';
import { verifyWalletAddress } from '@/lib/api/wallets';
import { Card, Spinner, Button } from '@/components/ui';

export default function WalletVerify() {
  return <Suspense><WalletVerifyContent /></Suspense>;
}

function WalletVerifyContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const verifyToken = searchParams?.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const calledRef = useRef(false);

  const handleVerify = useCallback(async () => {
    try {
      setLoading(true);
      await verifyWalletAddress({ token: verifyToken }, token);
      setVerified(true);
      toast.success(t('wallets.verifySuccess', { defaultValue: 'Address verified successfully!' }));
    } catch (err) {
      setError(err?.message || t('wallets.verifyError', { defaultValue: 'Verification failed' }));
    } finally {
      setLoading(false);
    }
  }, [verifyToken, token, toast, t]);

  useEffect(() => {
    if (verifyToken && !calledRef.current) {
      calledRef.current = true;
      handleVerify();
    }
  }, [verifyToken, handleVerify]);

  return (
    <div>
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center py-12 px-6">
              {loading ?
              <>
                  <Spinner role="status" size="lg" className="text-primary-600 mb-3 mx-auto" />

                
                  <p className="text-surface-500">
                    {t('wallets.verifying', { defaultValue: 'Verifying your address...' })}
                  </p>
                </> :
              verified ?
              <>
                  <i className="bx bx-check-circle text-green-500 mb-3 text-[3rem]"></i>
                  <h5 className="mb-2 font-semibold">
                    {t('wallets.verified', { defaultValue: 'Address Verified!' })}
                  </h5>
                  <p className="text-surface-500 mb-3">
                    {t('wallets.verifiedDesc', { defaultValue: 'Your withdrawal address has been verified successfully.' })}
                  </p>
                  <Button href="/withdrawals">
                    {t('wallets.goToWallets', { defaultValue: 'Go to Wallets' })}
                  </Button>
                </> :
              error ?
              <>
                  <i className="bx bx-error-circle text-red-500 mb-3 text-[3rem]"></i>
                  <h5 className="mb-2 font-semibold">
                    {t('wallets.verifyFailed', { defaultValue: 'Verification Failed' })}
                  </h5>
                  <p className="text-surface-500 mb-3">{error}</p>
                  <Button href="/withdrawals">
                    {t('wallets.goToWallets', { defaultValue: 'Go to Wallets' })}
                  </Button>
                </> :

              <>
                  <i className="bx bx-link text-surface-400 mb-3 text-[3rem]"></i>
                  <p className="text-surface-500">
                    {t('wallets.noToken', { defaultValue: 'No verification token found.' })}
                  </p>
                </>
              }
            </div>
          </Card>
        </div>
      </div>
    </div>);

}