import { useTranslation } from 'react-i18next'
import { NetworkIcon } from '../../components/CoinImg'
import useInvoicePayment, { formatDuration } from './payment/useInvoicePayment'
import { isSafeRedirectUrl } from '../../utils/url'
import { formatAmount } from '../../utils/format'
import NetworkSelectionPanel from './payment/NetworkSelectionPanel'
import PaymentQRSection from './payment/PaymentQRSection'
import PaymentProgressSteps from './payment/PaymentProgressSteps'

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

      {/* Header */}
      <div className="position-relative" style={{ zIndex: 1 }}>
        <div className="container py-2">
          <div className="d-flex justify-content-center align-items-center gap-3">
            <div className="position-relative">
              <div className="position-absolute w-100 h-100 rounded-circle" style={{
                background: 'var(--bs-primary)',
                filter: 'blur(20px)', opacity: 0.4
              }}></div>
              <div className="position-relative d-flex align-items-center justify-content-center" style={{
                width: 48, height: 48,
                background: 'var(--bs-primary)',
                borderRadius: 16,
                boxShadow: '0 8px 20px rgba(var(--bs-primary-rgb), 0.3)'
              }}>
                <i className="bx bx-wallet text-white" style={{ fontSize: 24 }}></i>
              </div>
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px', color: 'var(--bs-heading-color)' }}>BULL PAY</h2>
              <p className="mb-0" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Crypto Payment Gateway</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
      `}</style>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex align-items-center py-2">
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
              <div className="col-12 col-md-8 col-lg-5">
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
                          <div className="text-center rounded-3 mb-4" style={{
                            background: 'linear-gradient(135deg, var(--bs-primary), color-mix(in srgb, var(--bs-primary), #000 15%))',
                            padding: '20px 16px',
                          }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                              {t('invoices.amount', { defaultValue: 'Amount to Pay' })}
                            </div>
                            <div className="d-flex align-items-baseline justify-content-center gap-2">
                              <span style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-1px', color: '#fff', lineHeight: 1 }}>
                                {formatAmount(invoice.amount)}
                              </span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                                {coinSym}
                              </span>
                            </div>
                          </div>

                          {/* Network section header */}
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bs-heading-color)' }}>
                              {t('payment.stepNetwork', { defaultValue: 'Select Network' })}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--bs-secondary-color)' }}>
                              {t('payment.step', { defaultValue: 'Step' })} 1/2
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
                      {/* Invoice Info & Chain */}
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 gap-md-3 mb-3">
                        <div className="order-1">
                          <div className="small mb-1" style={{ color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', fontWeight: '600' }}>
                            {isPaymentMode ? (t("payment.payment", { defaultValue: "Payment" })) : t("invoices.invoice")}
                          </div>
                          <div className="fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '-0.5px', color: 'var(--bs-heading-color)' }}>
                            {isPaymentMode ? (invoice.publicCode || invoice.id) : `#${invoice.invoiceNumber || invoice.publicCode || invoice.id}`}
                          </div>
                        </div>
                        <div className="order-2 text-center px-3 py-2 rounded-2" style={{
                          background: 'rgba(var(--bs-primary-rgb), 0.1)',
                          border: '1px solid rgba(var(--bs-primary-rgb), 0.25)'
                        }}>
                          <div className="small mb-1" style={{ fontSize: '0.6rem', color: 'var(--bs-secondary-color)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {t("invoices.chain") || "Chain"}
                          </div>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <NetworkIcon networkSymbol={networkSym} size={24} />
                            <div className="fw-bold" style={{ fontSize: '0.9rem', color: 'var(--bs-primary)', letterSpacing: '0.5px', fontWeight: '700' }}>
                              {networkSym || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timer */}
                      {!isPaid && remainingMs !== undefined && (
                        <div className="text-center mb-3 p-3 rounded-4" style={{
                          background: remainingMs <= 60_000
                            ? 'linear-gradient(135deg, rgba(var(--bs-danger-rgb), 0.15), rgba(var(--bs-danger-rgb), 0.15))'
                            : remainingMs <= 5 * 60_000
                              ? 'linear-gradient(135deg, rgba(var(--bs-warning-rgb), 0.15), rgba(var(--bs-warning-rgb), 0.15))'
                              : 'rgba(var(--bs-primary-rgb), 0.1)',
                          border: remainingMs <= 60_000
                            ? '1px solid rgba(var(--bs-danger-rgb), 0.3)'
                            : remainingMs <= 5 * 60_000
                              ? '1px solid rgba(var(--bs-warning-rgb), 0.3)'
                              : '1px solid rgba(var(--bs-primary-rgb), 0.3)'
                        }}>
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                              width: 28, height: 28,
                              background: remainingMs <= 60_000
                                ? 'linear-gradient(135deg, var(--bs-danger), color-mix(in srgb, var(--bs-danger), #000 20%))'
                                : remainingMs <= 5 * 60_000
                                  ? 'linear-gradient(135deg, var(--bs-warning), color-mix(in srgb, var(--bs-warning), #000 20%))'
                                  : 'var(--bs-primary)',
                              animation: remainingMs <= 60_000 ? 'pulse 1.5s infinite' : 'none',
                              boxShadow: '0 4px 12px rgba(var(--bs-black-rgb), 0.1)'
                            }}>
                              <i className="bx bx-time text-white" style={{ fontSize: 16 }}></i>
                            </div>
                            <span className="small" style={{ color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.7rem', fontWeight: '700' }}>
                              {t("payment.timeRemaining")}
                            </span>
                          </div>
                          <div style={{
                            color: remainingMs <= 60_000 ? 'var(--bs-danger)' : 'var(--bs-warning)',
                            fontWeight: '900', fontSize: '2.25rem', letterSpacing: '5px'
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
                        <div className="mb-3">
                          <div className="small mb-2" style={{ color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem', fontWeight: '700' }}>
                            {t("invoices.paymentAddress")}
                          </div>
                          <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{
                            background: 'rgba(var(--bs-primary-rgb), 0.05)',
                            border: '1px solid rgba(var(--bs-primary-rgb), 0.15)',
                            boxShadow: 'inset 0 1px 0 rgba(var(--bs-white-rgb), 0.5)'
                          }}>
                            <code className="flex-grow-1 text-break mb-0 fw-medium" style={{ fontSize: '0.75rem', color: 'var(--bs-primary)', background: 'none' }}>
                              {invoice.paymentAddress || '-'}
                            </code>
                            {invoice.paymentAddress && (
                              <button type="button" className="btn btn-sm flex-shrink-0" style={{
                                background: copied
                                  ? 'linear-gradient(135deg, var(--bs-success), color-mix(in srgb, var(--bs-success), #000 20%))'
                                  : 'var(--bs-primary)',
                                border: 'none', color: 'white', borderRadius: 8, width: 36, height: 36,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                boxShadow: copied ? '0 4px 12px rgba(var(--bs-success-rgb), 0.4)' : '0 4px 12px rgba(var(--bs-primary-rgb), 0.4)',
                                transform: copied ? 'scale(1.1)' : 'scale(1)'
                              }} onClick={handleCopy}>
                                <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: 18 }}></i>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {invoice.description && (
                        <div className="mb-3 p-2 rounded-3" style={{
                          background: 'rgba(var(--bs-primary-rgb), 0.03)',
                          border: '1px solid rgba(var(--bs-primary-rgb), 0.1)'
                        }}>
                          <div className="small mb-2" style={{ color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', fontWeight: '700' }}>
                            {t("invoices.description")}
                          </div>
                          <div style={{ color: 'var(--bs-body-color)', lineHeight: 1.4, fontSize: '0.875rem' }}>{invoice.description}</div>
                        </div>
                      )}

                      {/* Paid At Info */}
                      {isPaid && invoice.paidAt && (
                        <div className="mb-3 p-3 rounded-4" style={{
                          background: 'linear-gradient(135deg, rgba(var(--bs-success-rgb), 0.08), rgba(var(--bs-success-rgb), 0.08))',
                          border: '1px solid rgba(var(--bs-success-rgb), 0.2)'
                        }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                              width: 28, height: 28,
                              background: 'linear-gradient(135deg, var(--bs-success), color-mix(in srgb, var(--bs-success), #000 20%))',
                              boxShadow: '0 4px 12px rgba(var(--bs-success-rgb), 0.3)'
                            }}>
                              <i className="bx bx-check text-white" style={{ fontSize: 16 }}></i>
                            </div>
                            <span className="small" style={{ color: 'var(--bs-success)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.7rem', fontWeight: '700' }}>
                              {t("payment.paidAt", { defaultValue: "Paid At" })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="fw-bold" style={{ color: 'var(--bs-success)', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
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
