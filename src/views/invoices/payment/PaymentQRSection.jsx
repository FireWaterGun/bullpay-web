import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import CoinImg from '../../../components/CoinImg'
import { formatAmount } from '../../../utils/format'

export default function PaymentQRSection({
  invoice, coinSym, networkName, paymentValue,
  isPaid, copiedAmt, handleCopyAmount
}) {
  const { t } = useTranslation()

  const amtStr = formatAmount(invoice.amount)
  const len = amtStr.length
  const fontSize = len > 14 ? '1rem' : len > 11 ? '1.2rem' : len > 8 ? '1.4rem' : '1.7rem'

  return (
    <div className="mb-4">
      {/* QR + Amount Card */}
      <div className="rounded-3 p-3" style={{ border: '1px solid var(--bs-border-color)' }}>
        <div className="d-flex gap-3 align-items-center">
          {/* QR Code - Left */}
          {!isPaid && (
            <div className="text-center flex-shrink-0">
              <div className="d-inline-block position-relative p-2 rounded-3" style={{ background: 'var(--bs-body-bg)' }}>
                <QRCode
                  value={paymentValue}
                  size={130}
                  includeMargin={false}
                  level="H"
                />
              </div>
              <div className="mt-2" style={{ fontSize: '0.75rem', color: 'var(--bs-secondary-color)', fontWeight: 500 }}>
                {t("payment.scanToPay") || "Scan to Pay"}
              </div>
            </div>
          )}

          {/* Coin Info + Amount - Right */}
          <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minWidth: 0 }}>
            {/* Coin */}
            <div className="d-flex align-items-center gap-2 mb-2">
              <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={32} imgClassName="rounded-circle" />
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--bs-heading-color)', lineHeight: 1.2 }}>
                  {coinSym}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--bs-secondary-color)', fontWeight: 500 }}>
                  on {networkName || 'Network'}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="d-flex align-items-center gap-2 mb-1">
              <span style={{
                fontSize, fontWeight: 800, letterSpacing: '-0.5px',
                color: 'var(--bs-primary)', lineHeight: 1,
              }}>
                {amtStr}
              </span>
              {invoice.amount != null && !isPaid && (
                <button
                  type="button"
                  className="btn btn-sm btn-icon flex-shrink-0"
                  style={{
                    width: 30, height: 30,
                    border: '1px solid var(--bs-border-color)',
                    borderRadius: 8,
                    background: copiedAmt ? 'var(--bs-success)' : 'var(--bs-body-bg)',
                    color: copiedAmt ? '#fff' : 'var(--bs-secondary-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={handleCopyAmount}
                  title={copiedAmt ? t("actions.copied") : t("actions.copyAmount", { defaultValue: "Copy Amount" })}
                >
                  <i className={`bx ${copiedAmt ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: 14 }}></i>
                </button>
              )}
            </div>

            {/* Fiat Equivalent */}
            {(invoice.fiatAmount || invoice.fiatCurrency) && (
              <div style={{ fontSize: '0.78rem', color: 'var(--bs-secondary-color)', fontWeight: 500 }}>
                ≈ ${invoice.fiatAmount || '0.00'} {invoice.fiatCurrency || 'USD'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
