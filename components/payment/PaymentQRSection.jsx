'use client'

import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import CoinImg from '@/components/CoinImg'
import { formatAmount } from '@/lib/utils/format'

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
      <div className="rounded-lg p-3" style={{ border: '1px solid var(--color-surface-200)' }}>
        <div className="flex gap-3 items-center">
          {/* QR Code - Left */}
          {!isPaid && (
            <div className="text-center shrink-0">
              <div className="inline-block relative p-2 rounded-lg" style={{ background: 'var(--color-surface-0, #fff)' }}>
                <QRCode
                  value={paymentValue}
                  size={130}
                  includeMargin={false}
                  level="H"
                />
              </div>
              <div className="mt-2" style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', fontWeight: 500 }}>
                {t("payment.scanToPay") || "Scan to Pay"}
              </div>
            </div>
          )}

          {/* Coin Info + Amount - Right */}
          <div className="grow flex flex-col items-center justify-center" style={{ minWidth: 0 }}>
            {/* Coin */}
            <div className="flex items-center gap-2 mb-2">
              <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={32} imgClassName="rounded-full" />
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-surface-900)', lineHeight: 1.2 }}>
                  {coinSym}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-surface-500)', fontWeight: 500 }}>
                  on {networkName || 'Network'}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-2 mb-1">
              <span style={{
                fontSize, fontWeight: 800, letterSpacing: '-0.5px',
                color: 'var(--color-primary-600)', lineHeight: 1,
              }}>
                {amtStr}
              </span>
              {invoice.amount != null && !isPaid && (
                <button
                  type="button"
                  className="btn btn-sm btn-icon shrink-0"
                  style={{
                    width: 30, height: 30,
                    border: '1px solid var(--color-surface-200)',
                    borderRadius: 8,
                    background: copiedAmt ? '#22c55e' : 'var(--color-surface-0, #fff)',
                    color: copiedAmt ? '#fff' : 'var(--color-surface-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={handleCopyAmount}
                  title={copiedAmt ? t("actions.copied") : t("actions.copyAmount", { defaultValue: "Copy Amount" })}
                >
                  <i className={`bx ${copiedAmt ?'bx-check' : 'bx-copy'}`} style={{ fontSize: 14 }}></i>
                </button>
              )}
            </div>

            {/* Fiat Equivalent */}
            {(invoice.fiatAmount || invoice.fiatCurrency) && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-surface-500)', fontWeight: 500 }}>
                ≈ ${invoice.fiatAmount || '0.00'} {invoice.fiatCurrency || 'USD'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
