'use client'

import { useTranslation } from 'react-i18next'
import { NetworkIcon } from '@/components/CoinImg'
import useInvoicePayment, { formatDuration } from '@/components/payment/useInvoicePayment'
import { isSafeRedirectUrl } from '@/lib/utils/url'
import { formatAmount } from '@/lib/utils/format'
import NetworkSelectionPanel from '@/components/payment/NetworkSelectionPanel'
import PaymentQRSection from '@/components/payment/PaymentQRSection'
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
    <div className="min-vh-100 position-relative" style={{ overflowX: 'hidden',
      background: 'linear-gradient(180deg, var(--bs-body-bg) 0%, var(--bs-tertiary-bg) 100%)'
    }}>
      {/* Subtle Background */}
      <div className="position-absolute w-100 h-100" style={{ zIndex: 0 }}>
        <div className="position-absolute rounded-circle" style={{
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(var(--bs-primary-rgb), 0.06) 0%, transparent 70%)',
          top: '5%', right: '10%', filter: 'blur(60px)'
        }}></div>
        <div className="position-absolute rounded-circle" style={{
          width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(var(--bs-primary-rgb), 0.04) 0%, transparent 70%)',
          bottom: '10%', left: '5%', filter: 'blur(80px)'
        }}></div>
      </div>


      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
      `}</style>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex align-items-center py-4 pt-5">
        <div className="container">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-white" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
          ) : errorCode === 'BIZ_1200' && !invoice ? (
            <div className="card border-0 shadow-lg mx-auto" style={{ maxWidth: 500, borderRadius: 12 }}>
              <div className="card-body text-center p-5">
                <div className="mb-4"><i className="bx bx-block" style={{ fontSize: 64, color: 'var(--bs-secondary-color)' }}></i></div>
                <h4 className="mb-3">{t('invoices.cancelled') || 'Cancelled'}</h4>
                <p className="text-muted">{t('payment.cancelledMessage') || 'This invoice has been cancelled.'}</p>
              </div>
            </div>
          ) : !invoice ? (
            <div className="text-center text-white">{t('invoices.notFound') || 'Not found'}</div>
          ) : (
            <div className="row justify-content-center position-relative" style={{ zIndex: 1 }}>
              <div className="col-11 col-sm-8 col-md-7 col-lg-4">
                <div className="position-relative">
                  {/* Card Glow */}
                  <div className="position-absolute w-100 h-100" style={{
                    background: 'rgba(var(--bs-primary-rgb), 0.15)',
                    borderRadius: 12, filter: 'blur(30px)', opacity: 0.6
                  }}></div>

                  <div className="card border-0 position-relative" style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: 'rgba(var(--bs-white-rgb), 0.95)', backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px rgba(var(--bs-black-rgb), 0.1), inset 0 1px 0 rgba(var(--bs-white-rgb), 0.8)',
                    border: '1px solid rgba(var(--bs-primary-rgb), 0.15)'
                  }}>
                    {/* Status Banner (Step 2 / paid / expired) */}
                    {!(isPaymentMode && needsNetworkSelection && !isPaid && !isExpiredUnpaid) && (
                      <div className="position-relative overflow-hidden" style={{
                        background: uiStatus === 'paid'
                          ? 'linear-gradient(135deg, var(--bs-success), color-mix(in srgb, var(--bs-success), #000 20%))'
                          : uiStatus === 'expired'
                            ? 'linear-gradient(135deg, var(--bs-danger), color-mix(in srgb, var(--bs-danger), #000 20%))'
                            : 'linear-gradient(135deg, var(--bs-warning), color-mix(in srgb, var(--bs-warning), #000 20%))',
                        padding: '14px 20px'
                      }}>
                        <div className="position-absolute w-100 h-100" style={{
                          background: 'linear-gradient(90deg, transparent, rgba(var(--bs-white-rgb),0.15), transparent)',
                          animation: 'shimmer 3s infinite', zIndex: 0, top: 0, left: 0
                        }}></div>
                        <div className="text-center position-relative" style={{ zIndex: 1 }}>
                          <div className="d-inline-flex align-items-center gap-2">
                            <i className={`bx ${uiStatus === 'paid' ? 'bx-check-circle' : uiStatus === 'pending' ? 'bx-time-five' : uiStatus === 'expired' ? 'bx-x-circle' : 'bx-info-circle'} text-white`} style={{ fontSize: 20 }}></i>
                            <span className="fw-bold text-uppercase text-white" style={{ letterSpacing: '2px', fontSize: '0.875rem' }}>
                              {statusLabel(uiStatus, t)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="card-body p-3 p-md-4">

                      {needsNetworkSelection ? (
                        <div>
                          {/* Amount card */}
                          <div className="text-center rounded-3 mb-4 position-relative overflow-hidden" style={{
                            background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 50%, color-mix(in srgb, var(--bs-primary), #000 20%) 100%)',
                            padding: '28px 16px',
                          }}>
                            {/* Decorative circles */}
                            <div className="position-absolute rounded-circle" style={{ width: 120, height: 120, background: 'rgba(255,255,255,0.06)', top: -30, right: -20 }}></div>
                            <div className="position-absolute rounded-circle" style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.04)', bottom: -20, left: -10 }}></div>
                            <div className="position-relative" style={{ zIndex: 1 }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>
                                {t('invoices.amount', { defaultValue: 'Amount' })}
                              </div>
                              <div className="d-flex align-items-baseline justify-content-center" style={{ gap: 6 }}>
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
                          <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex align-items-center" style={{ gap: 8 }}>
                              <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                                width: 26, height: 26, background: 'var(--bs-primary)', color: '#fff',
                                fontSize: '0.7rem', fontWeight: 700,
                              }}>1</div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bs-heading-color)' }}>
                                {t('payment.stepNetwork', { defaultValue: 'Network' })}
                              </span>
                            </div>
                            <div style={{ flex: 1, height: 1, background: 'var(--bs-border-color)', margin: '0 16px' }}></div>
                            <div className="d-flex align-items-center" style={{ gap: 8 }}>
                              <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                                width: 26, height: 26, background: 'var(--bs-border-color)', color: 'var(--bs-secondary-color)',
                                fontSize: '0.7rem', fontWeight: 700,
                              }}>2</div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--bs-secondary-color)' }}>
                                {t('payment.stepPayment', { defaultValue: 'Payment' })}
                              </span>
                            </div>
                          </div>

                          {/* Section header */}
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--bs-heading-color)' }}>
                              {t('payment.selectNetwork', { defaultValue: 'Select Network' })}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--bs-secondary-color)' }}>
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
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                        <div>
                          <div className="small mb-1" style={{ color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.65rem', fontWeight: '600' }}>
                            {isPaymentMode ? (t("payment.payment", { defaultValue: "Payment" })) : t("invoices.invoice")}
                          </div>
                          <div className="text-break" style={{ fontSize: '0.85rem', color: 'var(--bs-secondary-color)' }}>
                            {isPaymentMode ? (invoice.publicCode || invoice.id) : `#${invoice.invoiceNumber || invoice.publicCode || invoice.id}`}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill" style={{
                          background: 'rgba(var(--bs-primary-rgb), 0.08)',
                          border: '1px solid rgba(var(--bs-primary-rgb), 0.2)'
                        }}>
                          <NetworkIcon networkSymbol={networkSym} size={20} />
                          <span className="fw-bold" style={{ fontSize: '0.75rem', color: 'var(--bs-heading-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {networkSym || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Timer - horizontal row */}
                      {!isPaid && remainingMs !== undefined && (
                        <div className="d-flex align-items-center justify-content-between mb-3 p-3 rounded-3" style={{
                          border: '1px solid var(--bs-border-color)',
                        }}>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bx bx-time" style={{
                              fontSize: 20,
                              color: remainingMs <= 60_000 ? 'var(--bs-danger)' : 'var(--bs-secondary-color)',
                            }}></i>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--bs-secondary-color)' }}>
                              {t("payment.timeRemaining")}
                            </span>
                          </div>
                          <div style={{
                            fontWeight: 800,
                            fontSize: '1.25rem',
                            letterSpacing: '2px',
                            color: remainingMs <= 60_000 ? 'var(--bs-danger)' : remainingMs <= 5 * 60_000 ? 'var(--bs-warning)' : 'var(--bs-primary)',
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
                        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                          <i className="bx bx-error-circle me-2 fs-4"></i>
                          <div>{t("payment.expiredMessage") || "This invoice has expired. Please request a new payment link."}</div>
                        </div>
                      )}

                      {/* Payment Address */}
                      {!isExpiredUnpaid && !isPaid && (
                        <div className="mb-4">
                          <div className="small mb-2" style={{ color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.65rem', fontWeight: '700' }}>
                            {t("invoices.paymentAddress")}
                          </div>
                          <div className="d-flex align-items-center gap-2 p-3 rounded-3" style={{
                            border: '1px solid var(--bs-border-color)',
                          }}>
                            <code className="flex-grow-1 text-break mb-0" style={{ fontSize: '0.78rem', color: 'var(--bs-body-color)', background: 'none', fontWeight: 500 }}>
                              {invoice.paymentAddress || '-'}
                            </code>
                            {invoice.paymentAddress && (
                              <button type="button" className="btn btn-sm btn-icon flex-shrink-0" style={{
                                width: 36, height: 36,
                                border: '1px solid var(--bs-border-color)',
                                borderRadius: 8,
                                background: copied ? 'var(--bs-success)' : 'var(--bs-body-bg)',
                                color: copied ? '#fff' : 'var(--bs-secondary-color)',
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
                        <div className="mb-3 p-3 rounded-3" style={{
                          border: '1px solid var(--bs-border-color)',
                        }}>
                          <div className="small mb-2" style={{ color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.65rem', fontWeight: '700' }}>
                            {t("invoices.description")}
                          </div>
                          <div style={{ color: 'var(--bs-body-color)', lineHeight: 1.4, fontSize: '0.875rem' }}>{invoice.description}</div>
                        </div>
                      )}

                      {/* Paid At Info */}
                      {isPaid && invoice.paidAt && (
                        <div className="mb-3 p-3 rounded-3" style={{
                          background: 'rgba(var(--bs-success-rgb), 0.06)',
                          border: '1px solid rgba(var(--bs-success-rgb), 0.2)'
                        }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                              width: 28, height: 28, background: 'var(--bs-success)',
                            }}>
                              <i className="bx bx-check text-white" style={{ fontSize: 16 }}></i>
                            </div>
                            <span className="small" style={{ color: 'var(--bs-success)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.65rem', fontWeight: '700' }}>
                              {t("payment.paidAt", { defaultValue: "Paid At" })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="fw-bold" style={{ color: 'var(--bs-success)', fontSize: '1.1rem' }}>
                              {new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(invoice.paidAt))}
                            </div>
                            <div className="fw-semibold" style={{ color: 'var(--bs-success)', fontSize: '0.9rem', letterSpacing: '1px' }}>
                              {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(invoice.paidAt))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress Steps */}
                      <PaymentProgressSteps isPaid={isPaid} isExpiredUnpaid={isExpiredUnpaid} currentStep={currentStep} />

                      {/* Network Warning */}
                      {!isPaid && !isExpiredUnpaid && coinSym && networkName && (
                        <div className="d-flex align-items-start gap-2 p-3 rounded-3 mt-3" style={{
                          background: 'rgba(var(--bs-warning-rgb), 0.08)',
                          border: '1px solid rgba(var(--bs-warning-rgb), 0.25)',
                        }}>
                          <i className="bx bx-error flex-shrink-0" style={{ fontSize: 20, color: 'var(--bs-warning)', marginTop: 1 }}></i>
                          <div style={{ fontSize: '0.8rem', color: 'var(--bs-body-color)', lineHeight: 1.5 }}>
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
                          <a href={invoice.successUrl} className="btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2" style={{
                            background: 'linear-gradient(135deg, var(--bs-success) 0%, color-mix(in srgb, var(--bs-success), #000 20%) 100%)',
                            color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', letterSpacing: '0.5px',
                            boxShadow: '0 8px 24px rgba(var(--bs-success-rgb), 0.4)', textDecoration: 'none', transition: 'all 0.3s ease',
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
      <footer className="py-2 position-relative" style={{ zIndex: 1 }}>
        <div className="container text-center">
          <div className="mb-2" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
            {t("common.poweredBy", { defaultValue: "Powered by" })}
          </div>
          <div className="mb-2" style={{
            fontSize: '1.1rem', fontWeight: '700',
            color: 'var(--bs-primary)', letterSpacing: '1px'
          }}>BULL PAY</div>
          <div style={{ color: 'var(--bs-secondary-color)', fontSize: '0.75rem' }}>
            {t("common.copyright", { year }) || `© ${year} · All rights reserved`}
          </div>
        </div>
      </footer>
    </div>
  )
}
