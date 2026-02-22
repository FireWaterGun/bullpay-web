import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import CoinImg from '../../../components/CoinImg'
import { formatAmount } from '../../../utils/format'

export default function PaymentQRSection({
  invoice, coinSym, networkName, paymentValue,
  isPaid, copiedAmt, handleCopyAmount
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-3 p-4 rounded-4" style={{
      background: 'rgba(var(--bs-primary-rgb), 0.05)',
      border: '1px solid rgba(var(--bs-primary-rgb), 0.15)'
    }}>
      <div className="row g-4 align-items-center">
        {/* QR Code - Left Side (hidden when paid) */}
        {!isPaid && (
        <div className="col-12 col-md-6 text-center">
          <div className="d-inline-block position-relative">
            <div className="position-relative p-3 rounded-4" style={{
              background: 'white',
              boxShadow: '0 15px 40px rgba(var(--bs-black-rgb), 0.1)',
              border: '2px solid rgba(var(--bs-primary-rgb), 0.15)'
            }}>
              <QRCode
                value={paymentValue}
                size={160}
                includeMargin={false}
                level="H"
              />
              {/* Overlay coin icon */}
              <div className="position-absolute top-50 start-50 translate-middle" style={{
                background: 'white',
                borderRadius: '50%',
                padding: '4px',
                boxShadow: '0 2px 8px rgba(var(--bs-black-rgb),0.15)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={28} imgClassName="rounded-circle" />
              </div>
            </div>
          </div>
          <div className="mt-2 d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{
            background: 'rgba(var(--bs-primary-rgb), 0.1)',
            border: '1px solid rgba(var(--bs-primary-rgb), 0.2)'
          }}>
            <i className="bx bx-qr-scan" style={{ color: 'var(--bs-primary)', fontSize: '0.9rem' }}></i>
            <span className="small fw-semibold" style={{ color: 'var(--bs-heading-color)', fontSize: '0.75rem' }}>
              {t("payment.scanToPay") || "Scan to pay"}
            </span>
          </div>
        </div>
        )}

        {/* Amount */}
        <div className={`${isPaid ? 'col-12' : 'col-12 col-md-6'} text-center`}>
          <div className="small mb-3" style={{
            color: 'var(--bs-secondary-color)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontSize: '0.7rem',
            fontWeight: '700'
          }}>{t("invoices.amount")}</div>

          {/* Amount Card with Coin Info */}
          <div className="p-4 rounded-3" style={{
            background: 'rgba(var(--bs-primary-rgb), 0.08)',
            border: '2px solid rgba(var(--bs-primary-rgb), 0.2)',
            boxShadow: '0 4px 12px rgba(var(--bs-primary-rgb), 0.15)'
          }}>
            {/* Coin Icon and Name */}
            <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
              <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={48} imgClassName="rounded-circle" />
              <div className="text-start">
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: 'var(--bs-heading-color)',
                  letterSpacing: '0.5px',
                  lineHeight: 1.2
                }}>{coinSym}</div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--bs-secondary-color)',
                  fontWeight: '600'
                }}>{invoice?.coin?.name || coinSym}</div>
              </div>
            </div>

            {/* Amount Value */}
            <div className="d-flex align-items-center justify-content-center gap-2">
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                letterSpacing: '-2px',
                color: 'var(--bs-primary)',
                lineHeight: 1.1
              }}>
                {formatAmount(invoice.amount)}
              </div>
              {invoice.amount != null && !isPaid && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: copiedAmt
                      ? 'linear-gradient(135deg, var(--bs-success), color-mix(in srgb, var(--bs-success), #000 20%))'
                      : 'var(--bs-primary)',
                    border: 'none',
                    color: 'white',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: copiedAmt
                      ? '0 2px 8px rgba(var(--bs-success-rgb), 0.3)'
                      : '0 2px 8px rgba(var(--bs-primary-rgb), 0.3)',
                    transform: copiedAmt ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onClick={handleCopyAmount}
                  title={copiedAmt ? t("actions.copied") : t("actions.copyAmount", { defaultValue: "Copy Amount" })}
                >
                  <i className={`bx ${copiedAmt ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: '0.9rem' }}></i>
                </button>
              )}
            </div>

            {/* Network Info */}
            <div className="mt-2" style={{
              color: 'var(--bs-secondary-color)',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              on {networkName || 'Network'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
