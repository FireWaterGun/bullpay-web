'use client'

import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import CoinImg from '@/components/CoinImg'
import { formatAmount } from '@/lib/utils/format'
import Button from '../ui/Button'

export default function PaymentQRSection({
  invoice,
  coinSym,
  networkName,
  paymentValue,
  isPaid,
  copiedAmt,
  handleCopyAmount,
}) {
  const { t } = useTranslation()

  const amtStr = formatAmount(invoice.amount)
  const len = amtStr.length
  const fontSize = len > 14 ? '1rem' : len > 11 ? '1.2rem' : len > 8 ? '1.4rem' : '1.7rem'

  const bigFontSize = len > 14 ? '1.1rem' : len > 11 ? '1.35rem' : len > 8 ? '1.6rem' : '2rem'

  return (
    <div className="mb-2">
      {/* QR + Amount Card */}
      <div
        className="rounded-xl"
        style={{
          background: 'color-mix(in srgb, var(--color-primary-600) 3%, var(--color-surface-0, #fff))',
          border: '1px solid color-mix(in srgb, var(--color-primary-600) 12%, transparent)',
          padding: isPaid ? '10px 14px' : '12px',
        }}
      >
        {/* QR Code - Centered */}
        {!isPaid && (
          <div className="text-center mb-2">
            <div className="inline-block relative p-2.5 rounded-xl" style={{ background: '#fff' }}>
              <QRCode value={paymentValue} size={160} includeMargin={false} level="H" />
            </div>
          </div>
        )}

        {/* Coin + Amount — single row */}
        <div className={isPaid ? 'flex items-center justify-between' : 'flex items-center justify-between'}>
          {/* Coin */}
          <div className="flex items-center gap-2">
            <CoinImg
              symbol={coinSym}
              logoUrl={invoice?.coin?.logoUrl}
              size={isPaid ? 28 : 30}
              imgClassName="rounded-full"
            />
            <div>
              <div
                className={`font-bold text-surface-900 leading-[1.2] ${isPaid ? 'text-[0.9rem]' : 'text-[0.95rem]'}`}
              >
                {coinSym}
              </div>
              <div className="text-[0.62rem] text-surface-500 font-medium">on {networkName || 'Network'}</div>
            </div>
          </div>

          {/* Amount + copy */}
          <div className="flex items-center gap-1.5">
            <div className="text-right">
              <span
                className="font-extrabold tracking-[-0.5px] text-primary-600 leading-[1] block"
                style={{ fontSize: isPaid ? fontSize : bigFontSize }}
              >
                {amtStr}
              </span>
              {!isPaid && (invoice.fiatAmount || invoice.fiatCurrency) && (
                <div className="text-[0.7rem] text-surface-500 font-medium mt-0.5">
                  ≈ ${invoice.fiatAmount || '0.00'} {invoice.fiatCurrency || 'USD'}
                </div>
              )}
            </div>
            {invoice.amount != null && !isPaid && (
              <Button
                type="button"
                style={{
                  width: 30,
                  height: 30,
                  border: '1px solid color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
                  background: copiedAmt ? 'var(--color-success-500)' : 'var(--color-surface-0, #fff)',
                  color: copiedAmt ? '#fff' : 'var(--color-primary-600)',
                  padding: 0,
                  transition: 'all 0.2s ease',
                }}
                onClick={handleCopyAmount}
                title={copiedAmt ? t('actions.copied') : t('actions.copyAmount', { defaultValue: 'Copy Amount' })}
                size="icon"
                className="shrink-0 rounded-lg flex items-center justify-center"
              >
                <i className={`bx ${copiedAmt ? 'bx-check' : 'bx-copy'} text-[14px]`}></i>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
