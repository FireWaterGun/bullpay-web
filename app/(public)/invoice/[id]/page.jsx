'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useInvoicePay from '@/components/payment/useInvoicePay'
import PaymentDetailBody from '@/components/payment/PaymentDetailBody'
import Spinner from '@/components/ui/Spinner'

function statusLabel(s, t) {
  switch ((s || '').toLowerCase()) {
    case 'paid':
      return t('invoices.paid')
    case 'pending':
      return t('invoices.pending')
    case 'expired':
      return t('invoices.expired')
    case 'cancelled':
      return t('invoices.cancelled') || 'Cancelled'
    default:
      return s || '-'
  }
}

export default function InvoicePaymentPage() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mounted flag for SSR hydration guard
  useEffect(() => { setMounted(true) }, [])
  const {
    invoice,
    loading,
    error,
    errorCode,
    coinSym,
    networkName,
    networkSym,
    year,
    remainingMs,
    timerPercent,
    isPaid,
    hasPartial,
    isExpiredUnpaid,
    currentStep,
    confirmations,
    uiStatus,
    paymentValue,
    copied,
    copiedAmt,
    handleCopy,
    handleCopyAmount,
    redirectCountdown,
  } = useInvoicePay()

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{ background: 'linear-gradient(180deg, var(--color-surface-0, #fff) 0%, var(--color-surface-100) 100%)' }}
    >
      {/* Subtle Background */}
      <div className="absolute w-full h-full z-0">
        <div
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 300,
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary-600) 6%, transparent) 0%, transparent 70%)',
            top: '5%',
            right: '10%',
            filter: 'blur(60px)',
          }}
        ></div>
        <div
          className="absolute rounded-full"
          style={{
            width: 350,
            height: 350,
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary-600) 4%, transparent) 0%, transparent 70%)',
            bottom: '10%',
            left: '5%',
            filter: 'blur(80px)',
          }}
        ></div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>

      {/* Main Content */}
      <div className="grow flex items-center justify-center w-full py-4 pt-5">
        <div className="container">
          {!mounted || loading ? (
            <div className="text-center">
              <Spinner role="status" size="lg" className="text-white" />
            </div>
          ) : errorCode === 'BIZ_1200' && !invoice ? (
            <div className="bg-white rounded-xl shadow-lg mx-auto p-0 max-w-[500px]">
              <div className="text-center p-5">
                <div className="mb-4">
                  <i className="bx bx-block text-[64px] text-surface-500"></i>
                </div>
                <h4 className="mb-3" suppressHydrationWarning>
                  {t('invoices.cancelled') || 'Cancelled'}
                </h4>
                <p className="text-surface-500" suppressHydrationWarning>
                  {t('payment.cancelledMessage') || 'This invoice has been cancelled.'}
                </p>
              </div>
            </div>
          ) : !invoice ? (
            <div className="bg-white rounded-xl shadow-lg mx-auto p-0 max-w-[500px]">
              <div className="text-center p-5">
                <div className="mb-4">
                  <i className="bx bx-error-circle text-[64px] text-danger-400"></i>
                </div>
                <h4 className="mb-3 text-surface-900" suppressHydrationWarning>
                  {t('payment.invoiceNotFoundTitle', { defaultValue: 'Invoice Not Found' })}
                </h4>
                <p className="text-surface-500 text-[0.9rem]" suppressHydrationWarning>
                  {error || t('payment.invoiceNotFoundMessage', { defaultValue: 'This invoice link is invalid or has expired. Please check the URL and try again.' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center relative z-[1]">
              <div className="w-11/12 sm:w-8/12 md:w-7/12 lg:w-4/12">
                <div className="relative">
                  {/* Card Glow */}
                  <div
                    className="absolute w-full h-full rounded-[16px] opacity-40"
                    style={{
                      background: 'color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
                      filter: 'blur(25px)',
                    }}
                  ></div>

                  <div
                    className="relative rounded-[16px] overflow-hidden bg-white/95"
                    style={{
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      border: '1px solid color-mix(in srgb, var(--color-primary-600) 12%, transparent)',
                    }}
                  >
                    {/* Status Banner */}
                    <div
                      className="relative overflow-hidden py-[12px] px-[20px]"
                      style={{
                        background:
                          uiStatus === 'paid'
                            ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                            : uiStatus === 'expired'
                              ? 'linear-gradient(135deg, #f87171, #ef4444)'
                              : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      }}
                    >
                      <div
                        className="absolute w-full h-full z-0 top-[0px] left-[0px]"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                          animation: 'shimmer 3s infinite',
                        }}
                      ></div>
                      <div className="flex items-center justify-center relative z-[1]">
                        <div className="flex items-center gap-2">
                          <i
                            className={`bx ${uiStatus === 'paid' ? 'bx-check-circle' : uiStatus === 'pending' ? 'bx-time-five' : uiStatus === 'expired' ? 'bx-x-circle' : 'bx-info-circle'} text-white/90 text-[18px]`}
                          ></i>
                          <span className="font-semibold uppercase text-white/95 tracking-[1.5px] text-[0.8rem]">
                            {statusLabel(uiStatus, t)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 md:p-5">
                      <PaymentDetailBody
                        invoice={invoice}
                        isPaymentMode={false}
                        coinSym={coinSym}
                        networkName={networkName}
                        networkSym={networkSym}
                        remainingMs={remainingMs}
                        timerPercent={timerPercent}
                        isPaid={isPaid}
                        hasPartial={hasPartial}
                        isExpiredUnpaid={isExpiredUnpaid}
                        currentStep={currentStep}
                        confirmations={confirmations}
                        uiStatus={uiStatus}
                        paymentValue={paymentValue}
                        copied={copied}
                        copiedAmt={copiedAmt}
                        handleCopy={handleCopy}
                        handleCopyAmount={handleCopyAmount}
                        redirectCountdown={redirectCountdown}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {mounted && (
        <footer className="py-3 relative z-[1] w-full text-center">
          <div className="mb-1.5 text-surface-400 text-[0.65rem] tracking-[1px] font-medium">
            {t('common.poweredBy', { defaultValue: 'Powered by' })}
          </div>
          <div className="mb-1.5 inline-flex items-center gap-1.5">
            <i className="bx bxs-wallet-alt text-xl text-primary-600"></i>
            <span className="text-[1rem] font-bold tracking-[-0.02em]">
              <span className="text-surface-900">BULL</span>
              <span className="text-primary-600">PAY</span>
            </span>
          </div>
          <div className="text-surface-400 text-[0.65rem]">
            {t('common.copyright', { year }) || `© ${year} · All rights reserved`}
          </div>
        </footer>
      )}
    </div>
  )
}
