'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTranslation } from 'react-i18next'
import { NetworkIcon } from '@/components/CoinImg'
import useInvoicePayment, { formatDuration } from '@/components/payment/useInvoicePayment'
import { isSafeRedirectUrl } from '@/lib/utils/url'
import { formatAmount } from '@/lib/utils/format'
import NetworkSelectionPanel from '@/components/payment/NetworkSelectionPanel'
const PaymentQRSection = dynamic(() => import('@/components/payment/PaymentQRSection'), { ssr: false })
import PaymentProgressSteps from '@/components/payment/PaymentProgressSteps'
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

export default function InvoicePaymentV2() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const {
    invoice,
    loading,
    error,
    errorCode,
    paymentData,
    isPaymentMode,
    needsNetworkSelection,
    selectedNetwork,
    setSelectedNetwork,
    selectingNetwork,
    handleConfirmNetwork,
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
    isEstimate,
    rateRefreshIn,
  } = useInvoicePayment()

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
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
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
                <h4 className="mb-3" suppressHydrationWarning>{t('invoices.cancelled') || 'Cancelled'}</h4>
                <p className="text-surface-500" suppressHydrationWarning>
                  {t('payment.cancelledMessage') || 'This invoice has been cancelled.'}
                </p>
              </div>
            </div>
          ) : !invoice ? (
            <div className="text-center text-white" suppressHydrationWarning>{t('invoices.notFound') || 'Not found'}</div>
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
                    {/* Status Banner (Step 2 / paid / expired) */}
                    {!(isPaymentMode && needsNetworkSelection && !isPaid && !isExpiredUnpaid) && (
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
                    )}

                    {/* Card Body */}
                    <div className="p-4 md:p-5">
                      {needsNetworkSelection ? (
                        <div>
                          {/* Merchant Name */}
                          {invoice.merchantName && (
                            <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid var(--color-surface-200)' }}>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: 'color-mix(in srgb, var(--color-primary-600) 10%, transparent)' }}
                              >
                                <i className="bx bx-store text-primary-600 text-[16px]"></i>
                              </div>
                              <div>
                                <div className="text-[0.58rem] text-surface-400 uppercase tracking-[1px] font-semibold">
                                  {t('payment.payingTo', { defaultValue: 'Paying to' })}
                                </div>
                                <div className="text-[0.9rem] font-bold text-surface-900">
                                  {invoice.merchantName}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Amount card */}
                          <div
                            className="text-center rounded-lg mb-4 relative overflow-hidden py-[28px] px-[16px]"
                            style={{
                              background:
                                'linear-gradient(135deg, var(--color-primary-600) 0%, color-mix(in srgb, var(--color-primary-600), #000 10%) 50%, color-mix(in srgb, var(--color-primary-600), #000 20%) 100%)',
                            }}
                          >
                            {/* Decorative circles */}
                            <div
                              className="absolute rounded-full w-[120px] h-[120px] bg-white/6"
                              style={{ top: -30, right: -20 }}
                            ></div>
                            <div
                              className="absolute rounded-full w-20 h-20 bg-white/4"
                              style={{ bottom: -20, left: -10 }}
                            ></div>
                            <div className="relative z-[1]">
                              <div className="text-[0.65rem] font-semibold uppercase tracking-[2px] text-white/55 mb-3">
                                {isEstimate
                                  ? t('payment.estimatedAmount', { defaultValue: 'Estimated Amount' })
                                  : t('invoices.amount', { defaultValue: 'Amount' })}
                              </div>
                              <div className="flex items-baseline justify-center gap-1.5">
                                <span className="text-[2.25rem] font-bold tracking-[-1px] text-white leading-[1]">
                                  {formatAmount(invoice.amount)}
                                </span>
                                <span className="text-[0.95rem] font-semibold text-white/60">{coinSym}</span>
                              </div>
                              {(invoice.fiatAmount || paymentData?.fiatAmount) && (
                                <div className="text-[0.8rem] text-white/50 mt-2">
                                  ≈ ${invoice.fiatAmount || paymentData?.fiatAmount}{' '}
                                  {invoice.fiatCurrency || paymentData?.fiatCurrency || 'USD'}
                                </div>
                              )}
                              {isEstimate && (
                                <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[0.7rem] text-white/40">
                                  <i className="bx bx-refresh text-[14px]"></i>
                                  <span>
                                    {t('payment.rateRefreshesIn', {
                                      seconds: rateRefreshIn,
                                      defaultValue: `Rate refreshes in ${rateRefreshIn}s`,
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Step indicator */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex items-center justify-center rounded-full bg-primary-600 text-white text-[0.7rem] font-bold"
                                style={{ width: 26, height: 26 }}
                              >
                                1
                              </div>
                              <span className="text-[0.85rem] font-semibold text-surface-900">
                                {t('payment.stepNetwork', { defaultValue: 'Network' })}
                              </span>
                            </div>
                            <div className="flex-1 h-[1px] bg-surface-200 my-[0] mx-[16px]"></div>
                            <div className="flex items-center gap-2">
                              <div
                                className="flex items-center justify-center rounded-full bg-surface-200 text-surface-500 text-[0.7rem] font-bold"
                                style={{ width: 26, height: 26 }}
                              >
                                2
                              </div>
                              <span className="text-[0.85rem] font-medium text-surface-500">
                                {t('payment.stepPayment', { defaultValue: 'Payment' })}
                              </span>
                            </div>
                          </div>

                          {/* Section header */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[0.9rem] font-semibold text-surface-900">
                              {t('payment.selectNetwork', { defaultValue: 'Select Network' })}
                            </span>
                            <span className="text-xs text-surface-500">Step 1/2</span>
                          </div>

                          <NetworkSelectionPanel
                            paymentData={paymentData}
                            selectedNetwork={selectedNetwork}
                            setSelectedNetwork={setSelectedNetwork}
                            selectingNetwork={selectingNetwork}
                            handleConfirmNetwork={handleConfirmNetwork}
                            isPaid={isPaid}
                            remainingMs={remainingMs}
                            error={error}
                          />
                        </div>
                      ) : (
                        <div>
                          {/* Merchant Name */}
                          {invoice.merchantName && (
                            <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid var(--color-surface-200)' }}>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{
                                  background: 'color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
                                }}
                              >
                                <i className="bx bx-store text-primary-600 text-[16px]"></i>
                              </div>
                              <div>
                                <div className="text-[0.58rem] text-surface-400 uppercase tracking-[1px] font-semibold">
                                  {t('payment.payingTo', { defaultValue: 'Paying to' })}
                                </div>
                                <div className="text-[0.9rem] font-bold text-surface-900">
                                  {invoice.merchantName}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Payment ID & Network Badge */}
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                            <div>
                              <div className="text-[0.6rem] mb-0.5 text-surface-400 uppercase tracking-[1px] font-semibold">
                                {isPaymentMode
                                  ? t('payment.payment', { defaultValue: 'Payment' })
                                  : t('invoices.invoice')}
                              </div>
                              <div className="break-all text-[0.85rem] text-surface-600 font-medium">
                                {isPaymentMode
                                  ? invoice.publicCode || invoice.id
                                  : `#${invoice.invoiceNumber || invoice.publicCode || invoice.id}`}
                              </div>
                            </div>
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                              style={{
                                background: 'color-mix(in srgb, var(--color-primary-600) 6%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
                              }}
                            >
                              <NetworkIcon networkSymbol={networkSym} size={18} />
                              <span className="font-semibold text-[0.7rem] text-primary-600 uppercase tracking-[0.5px]">
                                {networkSym || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Timer - horizontal row */}
                          {!isPaid && remainingMs !== undefined && (
                            <div className="mb-3">
                              <div
                                className="flex items-center justify-between p-3 rounded-xl"
                                style={{
                                  background:
                                    'color-mix(in srgb, var(--color-primary-600) 3%, var(--color-surface-0, #fff))',
                                  border:
                                    '1px solid color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <i
                                    className="bx bx-time text-[20px]"
                                    style={{
                                      color:
                                        remainingMs <= 60_000
                                          ? '#ef4444'
                                          : 'var(--color-surface-500)',
                                    }}
                                  ></i>
                                  <span className="text-xs font-semibold uppercase tracking-[1px] text-surface-500">
                                    {t('payment.timeRemaining')}
                                  </span>
                                </div>
                                <div
                                  className="font-extrabold text-xl tracking-[2px]"
                                  style={{
                                    color:
                                      remainingMs <= 60_000
                                        ? '#ef4444'
                                        : remainingMs <= 5 * 60_000
                                          ? '#f59e0b'
                                          : 'var(--color-primary-600)',
                                  }}
                                >
                                  {formatDuration(remainingMs)}
                                </div>
                              </div>
                              {/* Progress bar */}
                              {timerPercent !== undefined && (
                                <div
                                  className="mt-1.5 h-[3px] rounded-full overflow-hidden"
                                  style={{
                                    background: 'color-mix(in srgb, var(--color-surface-200) 60%, transparent)',
                                  }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${timerPercent}%`,
                                      background:
                                        timerPercent <= 10
                                          ? '#ef4444'
                                          : timerPercent <= 30
                                            ? '#f59e0b'
                                            : 'var(--color-primary-600)',
                                      transition: 'width 1s linear',
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* QR Code & Amount Section */}
                          {!isExpiredUnpaid && (
                            <PaymentQRSection
                              invoice={invoice}
                              coinSym={coinSym}
                              networkName={networkName}
                              paymentValue={paymentValue}
                              isPaid={isPaid}
                              copiedAmt={copiedAmt}
                              handleCopyAmount={handleCopyAmount}
                            />
                          )}

                          {/* Expired Alert */}
                          {isExpiredUnpaid && (
                            <div
                              className="rounded-lg bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-300 flex items-center mb-4 p-4"
                              role="alert"
                            >
                              <i className="bx bx-error-circle mr-2 text-xl"></i>
                              <div>
                                {t('payment.expiredMessage') ||
                                  'This invoice has expired. Please request a new payment link.'}
                              </div>
                            </div>
                          )}

                          {/* Payment Address */}
                          {!isExpiredUnpaid && !isPaid && (
                            <div className="mb-4">
                              <div className="text-sm mb-2 text-surface-500 uppercase tracking-[1.5px] text-[0.65rem] font-semibold">
                                {t('invoices.paymentAddress')}
                              </div>
                              <div
                                className="flex items-center gap-2 p-3 rounded-xl"
                                style={{
                                  background: 'var(--color-surface-50, #f8f9fa)',
                                  border: '1px solid var(--color-surface-200)',
                                }}
                              >
                                <code className="grow break-all mb-0 text-[0.78rem] text-surface-900 bg-transparent font-medium">
                                  {invoice.paymentAddress || '-'}
                                </code>
                                {invoice.paymentAddress && (
                                  <button
                                    type="button"
                                    className="shrink-0 cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center"
                                    style={{
                                      border: '1px solid color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
                                      background: copied ? '#22c55e' : 'var(--color-surface-0, #fff)',
                                      color: copied ? '#fff' : 'var(--color-primary-600)',
                                      padding: 0,
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    }}
                                    onClick={handleCopy}
                                  >
                                    <i className={`bx ${copied ? 'bx-check' : 'bx-copy'} text-[16px]`}></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          {invoice.description && (
                            <div
                              className="mb-3 p-3 rounded-xl"
                              style={{
                                background: 'var(--color-surface-50, #f8f9fa)',
                                border: '1px solid var(--color-surface-200)',
                              }}
                            >
                              <div className="text-sm mb-2 text-surface-500 uppercase tracking-[1px] text-[0.65rem] font-semibold">
                                {t('invoices.description')}
                              </div>
                              <div className="text-surface-900 leading-[1.4] text-[0.875rem]">
                                {invoice.description}
                              </div>
                            </div>
                          )}

                          {/* Paid At Info */}
                          {isPaid && invoice.paidAt && (
                            <div
                              className="mb-3 flex items-center gap-2 py-3 px-4 rounded-xl"
                              style={{
                                background: 'color-mix(in srgb, #22c55e 5%, transparent)',
                                border: '1px solid color-mix(in srgb, #22c55e 15%, transparent)',
                              }}
                            >
                              <i className="bx bx-calendar-check text-success-500 text-[22px] shrink-0"></i>
                              <div className="grow">
                                <div className="text-[0.6rem] text-success-600 uppercase tracking-[1px] font-semibold mb-0.5">
                                  {t('payment.paidAt', { defaultValue: 'Paid At' })}
                                </div>
                                <div className="font-semibold text-success-600 text-[0.88rem]">
                                  {new Intl.DateTimeFormat(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  }).format(new Date(invoice.paidAt))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Progress Steps */}
                          <PaymentProgressSteps
                            isPaid={isPaid}
                            isExpiredUnpaid={isExpiredUnpaid}
                            currentStep={currentStep}
                          />

                          {/* Partial Payment Progress */}
                          {hasPartial && (
                            <div
                              className="mb-3 p-3 rounded-xl"
                              style={{
                                background: 'color-mix(in srgb, var(--color-primary-600) 3%, var(--color-surface-0, #fff))',
                                border: '1px solid color-mix(in srgb, var(--color-primary-600) 12%, transparent)',
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[0.65rem] font-semibold uppercase tracking-[1px] text-surface-500">
                                  {t('payment.amountReceived', { defaultValue: 'Amount received' })}
                                </span>
                                <span className="text-[0.78rem] font-bold text-primary-600">
                                  {formatAmount(invoice.paidAmount || '0')} / {formatAmount(invoice.amount)} {coinSym}
                                </span>
                              </div>
                              <div
                                className="h-[4px] rounded-full overflow-hidden"
                                style={{ background: 'var(--color-surface-200)' }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, (Number(invoice.paidAmount || 0) / Number(invoice.amount || 1)) * 100)}%`,
                                    background: 'var(--color-primary-600)',
                                    transition: 'width 0.5s ease',
                                  }}
                                />
                              </div>
                              {invoice.remainingAmount && (
                                <div className="mt-1.5 text-[0.7rem] text-surface-500">
                                  {t('payment.remaining', { defaultValue: 'Remaining' })}: <span className="font-semibold text-surface-700">{formatAmount(invoice.remainingAmount)} {coinSym}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Network Warning */}
                          {!isPaid && !isExpiredUnpaid && coinSym && networkName && (
                            <div
                              className="flex items-start gap-2.5 p-3 rounded-xl mt-3"
                              style={{
                                background: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                                border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)',
                              }}
                            >
                              <i className="bx bx-error shrink-0 text-[20px] text-warning-500 mt-[1px]"></i>
                              <div className="text-[0.8rem] text-surface-900 leading-[1.5]">
                                <span>
                                  {t('payment.networkWarningSendOnly', { defaultValue: 'Send only' })} <b>{coinSym}</b>{' '}
                                  {t('payment.networkWarningOn', { defaultValue: 'on' })} <b>{networkName}</b>{' '}
                                  {t('payment.networkWarningLoss', {
                                    defaultValue: 'network. Using wrong network may result in permanent loss of funds.',
                                  })}
                                </span>
                                {confirmations != null && (
                                  <div className="mt-1 text-[0.75rem] text-surface-600">
                                    <i className="bx bx-check-shield text-[14px] mr-0.5 align-middle"></i>
                                    {t('payment.confirmationsRequired', {
                                      count: confirmations,
                                      defaultValue: `Requires ${confirmations} network confirmation${confirmations !== 1 ? 's' : ''}`,
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Success Redirect */}
                          {isPaid && invoice?.successUrl && isSafeRedirectUrl(invoice.successUrl) && (
                            <div className="mt-3">
                              <a
                                href={invoice.successUrl}
                                className="w-full py-3 font-bold flex items-center justify-center gap-2 text-white border-none rounded-xl text-[1rem] tracking-[0.5px] no-underline"
                                style={{
                                  background:
                                    'linear-gradient(135deg, #22c55e 0%, color-mix(in srgb, #22c55e, #000 20%) 100%)',
                                  boxShadow: '0 8px 24px color-mix(in srgb, #22c55e 40%, transparent)',
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <i className="bx bx-check-circle text-[20px]"></i>
                                {redirectCountdown != null
                                  ? `${t('payment.backToMerchant', { defaultValue: 'Redirecting' })} (${redirectCountdown}s)`
                                  : t('payment.backToMerchant', { defaultValue: 'Continue' })}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
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
