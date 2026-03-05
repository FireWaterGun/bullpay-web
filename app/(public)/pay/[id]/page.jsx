'use client'

import dynamic from 'next/dynamic'
import { useTranslation } from 'react-i18next'
import { NetworkIcon } from '@/components/CoinImg'
import useInvoicePayment, { formatDuration } from '@/components/payment/useInvoicePayment'
import { isSafeRedirectUrl } from '@/lib/utils/url'
import { formatAmount } from '@/lib/utils/format'
import NetworkSelectionPanel from '@/components/payment/NetworkSelectionPanel'
const PaymentQRSection = dynamic(() => import('@/components/payment/PaymentQRSection'), { ssr: false })
import PaymentProgressSteps from '@/components/payment/PaymentProgressSteps'

function statusLabel(s, t) {
  switch ((s || "").toLowerCase()) {
    case "paid": return t("invoices.paid")
    case "pending": return t("invoices.pending")
    case "expired": return t("invoices.expired")
    case 'cancelled': return t('invoices.cancelled') || 'Cancelled'
    default: return s || "-"
  }
}

export default function InvoicePaymentV2() {
  const { t } = useTranslation()
  const {
    invoice, loading, error, errorCode, paymentData,
    isPaymentMode, needsNetworkSelection,
    selectedNetwork, setSelectedNetwork, selectingNetwork, handleConfirmNetwork,
    coinSym, networkName, networkSym, year,
    remainingMs, isPaid, isExpiredUnpaid, currentStep, uiStatus,
    paymentValue, copied, copiedAmt, handleCopy, handleCopyAmount,
    redirectCountdown,
  } = useInvoicePayment()

  return (
    <div className="min-h-screen relative" style={{ overflowX: 'hidden',
      background: 'linear-gradient(180deg, var(--color-surface-0, #fff) 0%, var(--color-surface-100) 100%)'
    }}>
      {/* Subtle Background */}
      <div className="absolute w-full h-full" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{
          width: 300, height: 300,
          background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-600) 6%, transparent) 0%, transparent 70%)',
          top: '5%', right: '10%', filter: 'blur(60px)'
        }}></div>
        <div className="absolute rounded-full" style={{
          width: 350, height: 350,
          background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-600) 4%, transparent) 0%, transparent 70%)',
          bottom: '10%', left: '5%', filter: 'blur(80px)'
        }}></div>
      </div>


      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
      `}</style>

      {/* Main Content */}
      <div className="grow flex items-center py-4 pt-5">
        <div className="container">
          {loading ? (
            <div className="text-center">
              <div className="spinner w-8 h-8 border-3 text-white" role="status"><span className="sr-only">Loading...</span></div>
            </div>
          ) : errorCode === 'BIZ_1200' && !invoice ? (
            <div className="bg-white rounded-xl shadow-lg mx-auto p-0" style={{ maxWidth: 500 }}>
              <div className="text-center p-5">
                <div className="mb-4"><i className="bx bx-block" style={{ fontSize: 64, color: 'var(--color-surface-500)' }}></i></div>
                <h4 className="mb-3">{t('invoices.cancelled') || 'Cancelled'}</h4>
                <p className="text-surface-500">{t('payment.cancelledMessage') || 'This invoice has been cancelled.'}</p>
              </div>
            </div>
          ) : !invoice ? (
            <div className="text-center text-white">{t('invoices.notFound') || 'Not found'}</div>
          ) : (
            <div className="flex justify-center relative" style={{ zIndex: 1 }}>
              <div className="w-11/12 sm:w-8/12 md:w-7/12 lg:w-4/12">
                <div className="relative">
                  {/* Card Glow */}
                  <div className="absolute w-full h-full" style={{
                    background: 'color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
                    borderRadius: 12, filter: 'blur(30px)', opacity: 0.6
                  }}></div>

                  <div className="relative" style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    border: '1px solid color-mix(in srgb, var(--color-primary-600) 15%, transparent)'
                  }}>
                    {/* Status Banner (Step 2 / paid / expired) */}
                    {!(isPaymentMode && needsNetworkSelection && !isPaid && !isExpiredUnpaid) && (
                      <div className="relative overflow-hidden" style={{
                        background: uiStatus === 'paid'
                          ? 'linear-gradient(135deg, #22c55e, color-mix(in srgb, #22c55e, #000 20%))'
                          : uiStatus === 'expired'
                            ? 'linear-gradient(135deg, #ef4444, color-mix(in srgb, #ef4444, #000 20%))'
                            : 'linear-gradient(135deg, #f59e0b, color-mix(in srgb, #f59e0b, #000 20%))',
                        padding: '14px 20px'
                      }}>
                        <div className="absolute w-full h-full" style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                          animation: 'shimmer 3s infinite', zIndex: 0, top: 0, left: 0
                        }}></div>
                        <div className="text-center relative" style={{ zIndex: 1 }}>
                          <div className="inline-flex items-center gap-2">
                            <i className={`bx ${uiStatus === 'paid' ? 'bx-check-circle' : uiStatus === 'pending' ? 'bx-time-five' : uiStatus === 'expired' ? 'bx-x-circle' : 'bx-info-circle'} text-white`} style={{ fontSize: 20 }}></i>
                            <span className="font-bold uppercase text-white" style={{ letterSpacing: '2px', fontSize: '0.875rem' }}>
                              {statusLabel(uiStatus, t)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-3 md:p-4">

                      {needsNetworkSelection ? (
                        <div>
                          {/* Amount card */}
                          <div className="text-center rounded-lg mb-4 relative overflow-hidden" style={{
                            background: 'linear-gradient(135deg, var(--color-primary-600) 0%, color-mix(in srgb, var(--color-primary-600), #000 10%) 50%, color-mix(in srgb, var(--color-primary-600), #000 20%) 100%)',
                            padding: '28px 16px',
                          }}>
                            {/* Decorative circles */}
                            <div className="absolute rounded-full" style={{ width: 120, height: 120, background: 'rgba(255,255,255,0.06)', top: -30, right: -20 }}></div>
                            <div className="absolute rounded-full" style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.04)', bottom: -20, left: -10 }}></div>
                            <div className="relative" style={{ zIndex: 1 }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>
                                {t('invoices.amount', { defaultValue: 'Amount' })}
                              </div>
                              <div className="flex items-baseline justify-center" style={{ gap: 6 }}>
                                <span style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-1px', color: '#fff', lineHeight: 1 }}>
                                  {formatAmount(invoice.amount)}
                                </span>
                                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                                  {coinSym}
                                </span>
                              </div>
                              {(invoice.fiatAmount || paymentData?.fiatAmount) && (
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                                  ≈ ${invoice.fiatAmount || paymentData?.fiatAmount} {invoice.fiatCurrency || paymentData?.fiatCurrency || 'USD'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Step indicator */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center" style={{ gap: 8 }}>
                              <div className="flex items-center justify-center rounded-full" style={{
                                width: 26, height: 26, background: 'var(--color-primary-600)', color: '#fff',
                                fontSize: '0.7rem', fontWeight: 700,
                              }}>1</div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>
                                {t('payment.stepNetwork', { defaultValue: 'Network' })}
                              </span>
                            </div>
                            <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)', margin: '0 16px' }}></div>
                            <div className="flex items-center" style={{ gap: 8 }}>
                              <div className="flex items-center justify-center rounded-full" style={{
                                width: 26, height: 26, background: 'var(--color-surface-200)', color: 'var(--color-surface-500)',
                                fontSize: '0.7rem', fontWeight: 700,
                              }}>2</div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-surface-500)' }}>
                                {t('payment.stepPayment', { defaultValue: 'Payment' })}
                              </span>
                            </div>
                          </div>

                          {/* Section header */}
                          <div className="flex items-center justify-between mb-3">
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-surface-900)' }}>
                              {t('payment.selectNetwork', { defaultValue: 'Select Network' })}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
                              Step 1/2
                            </span>
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
                      {/* Payment ID & Network Badge */}
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <div>
                          <div className="text-sm mb-1" style={{ color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.65rem', fontWeight: '600' }}>
                            {isPaymentMode ? (t("payment.payment", { defaultValue: "Payment" })) : t("invoices.invoice")}
                          </div>
                          <div className="break-all" style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)' }}>
                            {isPaymentMode ? (invoice.publicCode || invoice.id) : `#${invoice.invoiceNumber || invoice.publicCode || invoice.id}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{
                          background: 'color-mix(in srgb, var(--color-primary-600) 8%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--color-primary-600) 20%, transparent)'
                        }}>
                          <NetworkIcon networkSymbol={networkSym} size={20} />
                          <span className="font-bold" style={{ fontSize: '0.75rem', color: 'var(--color-surface-900)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {networkSym || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Timer - horizontal row */}
                      {!isPaid && remainingMs !== undefined && (
                        <div className="flex items-center justify-between mb-3 p-3 rounded-lg" style={{
                          border: '1px solid var(--color-surface-200)',
                        }}>
                          <div className="flex items-center gap-2">
                            <i className="bx bx-time" style={{
                              fontSize: 20,
                              color: remainingMs <= 60_000 ? '#ef4444' : 'var(--color-surface-500)',
                            }}></i>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-surface-500)' }}>
                              {t("payment.timeRemaining")}
                            </span>
                          </div>
                          <div style={{
                            fontWeight: 800,
                            fontSize: '1.25rem',
                            letterSpacing: '2px',
                            color: remainingMs <= 60_000 ? '#ef4444' : remainingMs <= 5 * 60_000 ? '#f59e0b' : 'var(--color-primary-600)',
                          }}>
                            {formatDuration(remainingMs)}
                          </div>
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
                        <div className="rounded-lg bg-red-50 text-red-700 flex items-center mb-4 p-4" role="alert">
                          <i className="bx bx-error-circle mr-2 text-xl"></i>
                          <div>{t("payment.expiredMessage") || "This invoice has expired. Please request a new payment link."}</div>
                        </div>
                      )}

                      {/* Payment Address */}
                      {!isExpiredUnpaid && !isPaid && (
                        <div className="mb-4">
                          <div className="text-sm mb-2" style={{ color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.65rem', fontWeight: '700' }}>
                            {t("invoices.paymentAddress")}
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-lg" style={{
                            border: '1px solid var(--color-surface-200)',
                          }}>
                            <code className="grow break-all mb-0" style={{ fontSize: '0.78rem', color: 'var(--color-surface-900)', background: 'none', fontWeight: 500 }}>
                              {invoice.paymentAddress || '-'}
                            </code>
                            {invoice.paymentAddress && (
                              <button type="button" className="shrink-0 cursor-pointer" style={{
                                width: 36, height: 36,
                                border: '1px solid var(--color-surface-200)',
                                borderRadius: 8,
                                background: copied ? '#22c55e' : 'var(--color-surface-0, #fff)',
                                color: copied ? '#fff' : 'var(--color-surface-500)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 0,
                                transition: 'all 0.2s ease',
                              }} onClick={handleCopy}>
                                <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: 16 }}></i>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {invoice.description && (
                        <div className="mb-3 p-3 rounded-lg" style={{
                          border: '1px solid var(--color-surface-200)',
                        }}>
                          <div className="text-sm mb-2" style={{ color: 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.65rem', fontWeight: '700' }}>
                            {t("invoices.description")}
                          </div>
                          <div style={{ color: 'var(--color-surface-900)', lineHeight: 1.4, fontSize: '0.875rem' }}>{invoice.description}</div>
                        </div>
                      )}

                      {/* Paid At Info */}
                      {isPaid && invoice.paidAt && (
                        <div className="mb-3 p-3 rounded-lg" style={{
                          background: 'color-mix(in srgb, #22c55e 6%, transparent)',
                          border: '1px solid color-mix(in srgb, #22c55e 20%, transparent)'
                        }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="rounded-full flex items-center justify-center" style={{
                              width: 28, height: 28, background: '#22c55e',
                            }}>
                              <i className="bx bx-check text-white" style={{ fontSize: 16 }}></i>
                            </div>
                            <span className="text-sm" style={{ color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.65rem', fontWeight: '700' }}>
                              {t("payment.paidAt", { defaultValue: "Paid At" })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="font-bold" style={{ color: '#22c55e', fontSize: '1.1rem' }}>
                              {new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(invoice.paidAt))}
                            </div>
                            <div className="font-semibold" style={{ color: '#22c55e', fontSize: '0.9rem', letterSpacing: '1px' }}>
                              {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(invoice.paidAt))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress Steps */}
                      <PaymentProgressSteps isPaid={isPaid} isExpiredUnpaid={isExpiredUnpaid} currentStep={currentStep} />

                      {/* Network Warning */}
                      {!isPaid && !isExpiredUnpaid && coinSym && networkName && (
                        <div className="flex items-start gap-2 p-3 rounded-lg mt-3" style={{
                          background: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                          border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)',
                        }}>
                          <i className="bx bx-error shrink-0" style={{ fontSize: 20, color: '#f59e0b', marginTop: 1 }}></i>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-surface-900)', lineHeight: 1.5 }}>
                            <span>
                              {t("payment.networkWarningSendOnly", { defaultValue: "Send only" })}{' '}
                              <b>{coinSym}</b>{' '}
                              {t("payment.networkWarningOn", { defaultValue: "on" })}{' '}
                              <b>{networkName}</b>{' '}
                              {t("payment.networkWarningLoss", { defaultValue: "network. Using wrong network may result in permanent loss of funds." })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Success Redirect */}
                      {isPaid && invoice?.successUrl && isSafeRedirectUrl(invoice.successUrl) && (
                        <div className="mt-3">
                          <a href={invoice.successUrl} className="w-full py-3 font-bold flex items-center justify-center gap-2" style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, color-mix(in srgb, #22c55e, #000 20%) 100%)',
                            color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', letterSpacing: '0.5px',
                            boxShadow: '0 8px 24px color-mix(in srgb, #22c55e 40%, transparent)', textDecoration: 'none', transition: 'all 0.3s ease',
                          }}>
                            <i className="bx bx-check-circle" style={{ fontSize: 20 }}></i>
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
      <footer className="py-2 relative" style={{ zIndex: 1 }}>
        <div className="container text-center">
          <div className="mb-2" style={{ color: 'var(--color-surface-500)', fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
            {t("common.poweredBy", { defaultValue: "Powered by" })}
          </div>
          <div className="mb-2" style={{
            fontSize: '1.1rem', fontWeight: '700',
            color: 'var(--color-primary-600)', letterSpacing: '1px'
          }}>BULL PAY</div>
          <div style={{ color: 'var(--color-surface-500)', fontSize: '0.75rem' }}>
            {t("common.copyright", { year }) || `© ${year} · All rights reserved`}
          </div>
        </div>
      </footer>
    </div>
  )
}
