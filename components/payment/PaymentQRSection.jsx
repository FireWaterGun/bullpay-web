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
    <div className="mb-3">
      {/* QR + Amount Card */}
      <div
        className="rounded-xl"
        style={{
          background: 'color-mix(in srgb, var(--color-primary-600) 3%, var(--color-surface-0, #fff))',
          border: '1px solid color-mix(in srgb, var(--color-primary-600) 12%, transparent)',
          padding: isPaid ? '12px 16px' : '16px',
        }}
      >
        {/* QR Code - Centered */}
        {!isPaid && (
          <div className="text-center mb-4">
            <div
              className="inline-block relative p-3 rounded-xl"
              style={{ background: '#fff' }}
            >
              <QRCode value={paymentValue} size={200} includeMargin={false} level="H" />
            </div>
            <div className="mt-2.5 text-[0.75rem] text-surface-500 font-medium">
              {t('payment.scanToPay') || 'Scan to Pay'}
            </div>
          </div>
        )}

        {/* Divider */}
        {!isPaid && (
          <div
            className="mx-auto mb-4"
            style={{
              width: '40%',
              height: 1,
              background: 'color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
            }}
          />
        )}

        {/* Coin Info + Amount */}
        <div className={isPaid ? 'flex items-center justify-between' : 'flex flex-col items-center'}>
          {/* Coin */}
          <div className={`flex items-center gap-2 ${isPaid ? '' : 'mb-3'}`}>
            <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={isPaid ? 28 : 36} imgClassName="rounded-full" />
            <div>
              <div className={`font-bold text-surface-900 leading-[1.2] ${isPaid ? 'text-[0.9rem]' : 'text-[1.05rem]'}`}>{coinSym}</div>
              <div className="text-[0.68rem] text-surface-500 font-medium">on {networkName || 'Network'}</div>
            </div>
          </div>

          {/* Amount */}
          <div className={`flex items-center gap-2 ${isPaid ? '' : 'mb-1'}`}>
            <span
              className="font-extrabold tracking-[-0.5px] text-primary-600 leading-[1]"
              style={{ fontSize: isPaid ? fontSize : bigFontSize }}
            >
              {amtStr}
            </span>
            {invoice.amount != null && !isPaid && (
              <Button
                type="button"
                style={{
                  width: 32,
                  height: 32,
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

        {/* Fiat Equivalent - only when not paid */}
        {!isPaid && (invoice.fiatAmount || invoice.fiatCurrency) && (
          <div className="text-[0.8rem] text-surface-500 font-medium mt-0.5 text-center">
            ≈ ${invoice.fiatAmount || '0.00'} {invoice.fiatCurrency || 'USD'}
          </div>
        )}
      </div>
    </div>
  )
}
