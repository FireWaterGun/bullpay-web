'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dynamic from 'next/dynamic'
import Card from '@/components/ui/Card'
import CoinImg from '@/components/CoinImg'
import { formatAmount } from '@/lib/utils/format'

const QRCodeSVG = dynamic(() => import('qrcode.react').then((m) => m.QRCodeSVG), { ssr: false })

/** Coin + Network + Amount row — reused across all status states */
function CoinAmountRow({ invoice }) {
  const coinSym = (invoice?.coin?.symbol || invoice?.coinSymbol || '').toUpperCase()
  const networkSym = (invoice?.network?.symbol || invoice?.networkSymbol || '').toUpperCase()
  const networkName = invoice?.network?.name || ''
  if (!coinSym) return null

  const amtStr = formatAmount(invoice.amount)
  const len = amtStr.length
  const fontSize = len > 14 ? '0.95rem' : len > 11 ? '1.1rem' : len > 8 ? '1.25rem' : '1.4rem'

  return (
    <div
      className="flex items-center justify-between p-2.5 rounded-xl"
      style={{
        background: 'color-mix(in srgb, var(--color-primary-600) 3%, var(--color-surface-0, #fff))',
        border: '1px solid color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
      }}
    >
      <div className="flex items-center gap-2">
        <CoinImg
          symbol={coinSym}
          logoUrl={invoice?.coin?.logoUrl}
          networkSymbol={networkSym}
          size={28}
          imgClassName="rounded-full"
        />
        <div>
          <div className="font-bold text-surface-900 text-[0.85rem] leading-[1.2]">{coinSym}</div>
          <div className="text-[0.6rem] text-surface-500 font-medium">{networkName || networkSym}</div>
        </div>
      </div>
      <div className="text-right">
        <span
          className="font-extrabold tracking-[-0.5px] text-primary-600 leading-[1] block"
          style={{ fontSize }}
        >
          {amtStr}
        </span>
        {(invoice.fiatAmount || invoice.fiatCurrency) && (
          <div className="text-[0.65rem] text-surface-500 font-medium mt-0.5">
            ≈ {invoice.fiatAmount || '0.00'} {(invoice.fiatCurrency || 'USD').toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Invoice status card for the detail sidebar.
 * Matches the PaymentDetailBody design language (color-mix, rounded-xl, etc.).
 */
export default function InvoiceStatusCard({ invoice, effectiveStatus: status }) {
  const { t } = useTranslation()

  const publicUrl =
    invoice?.publicCode && typeof window !== 'undefined'
      ? `${window.location.origin}/pay/${invoice.publicCode}`
      : ''

  if (!status) return null

  const s = status.toLowerCase()

  // ─── Paid / Completed / Confirmed ───
  if (['paid', 'completed', 'confirmed'].includes(s)) {
    return (
      <Card className="mb-4">
        <div
          className="p-5 text-center rounded-xl"
          style={{
            background: 'color-mix(in srgb, #22c55e 6%, var(--color-surface-0, #fff))',
            border: '1px solid color-mix(in srgb, #22c55e 18%, transparent)',
          }}
        >
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2.5"
            style={{ background: 'color-mix(in srgb, #22c55e 12%, transparent)' }}
          >
            <i className="bx bx-check-circle text-2xl text-success-500"></i>
          </div>
          <div className="text-success-700 dark:text-success-400 font-bold text-[0.95rem]">
            {t('payment.paymentReceived', { defaultValue: 'Payment Received' })}
          </div>
          <div className="text-success-600/60 dark:text-success-400/60 text-xs mt-1 mb-3">
            {t('invoices.paymentReceivedDesc', { defaultValue: 'This invoice has been paid successfully' })}
          </div>
          <CoinAmountRow invoice={invoice} />
        </div>
      </Card>
    )
  }

  // ─── Expired ───
  if (s === 'expired' || s === 'cancelled') {
    return (
      <Card className="mb-4">
        <div
          className="p-5 text-center rounded-xl"
          style={{
            background: 'var(--color-surface-50, #f8f9fa)',
            border: '1px solid var(--color-surface-200)',
          }}
        >
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2.5"
            style={{ background: 'color-mix(in srgb, var(--color-surface-400) 15%, transparent)' }}
          >
            <i className="bx bx-time-five text-2xl text-surface-400"></i>
          </div>
          <div className="text-surface-600 dark:text-surface-300 font-bold text-[0.95rem]">
            {t('payment.expired', { defaultValue: 'Expired' })}
          </div>
          <div className="text-surface-400 text-xs mt-1 mb-3">
            {t('payment.expiredMessage', { defaultValue: 'This invoice has expired' })}
          </div>
          <CoinAmountRow invoice={invoice} />
        </div>
      </Card>
    )
  }

  // ─── Confirming ───
  if (s === 'confirming' || s === 'detecting') {
    return (
      <Card className="mb-4">
        <div
          className="p-5 text-center rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--color-primary-600) 4%, var(--color-surface-0, #fff))',
            border: '1px solid color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
          }}
        >
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2.5"
            style={{ background: 'color-mix(in srgb, var(--color-primary-600) 10%, transparent)' }}
          >
            <i className="bx bx-loader-alt bx-spin text-2xl text-primary-600"></i>
          </div>
          <div className="text-primary-700 dark:text-primary-300 font-bold text-[0.95rem]">
            {t('invoices.confirming', { defaultValue: 'Confirming' })}
          </div>
          <div className="text-primary-600/60 dark:text-primary-400/60 text-xs mt-1 mb-3">
            {t('invoices.confirmingDesc', { defaultValue: 'Waiting for blockchain confirmations' })}
          </div>
          <CoinAmountRow invoice={invoice} />
        </div>
      </Card>
    )
  }

  // ─── Pending (default) → QR Code + Coin/Amount + Countdown ───
  return (
    <Card className="mb-4">
      {/* QR section */}
      <div className="p-4 text-center">
        {publicUrl && (
          <>
            <div
              className="inline-block p-2.5 rounded-xl"
              style={{
                background: '#fff',
                border: '1px solid color-mix(in srgb, var(--color-primary-600) 12%, transparent)',
              }}
            >
              <QRCodeSVG value={publicUrl} size={148} includeMargin={false} level="H" />
            </div>
            <div
              className="mt-3 mx-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg"
              style={{
                background: 'color-mix(in srgb, var(--color-primary-600) 4%, var(--color-surface-0, #fff))',
                border: '1px solid color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
              }}
            >
              <i className="bx bx-scan text-primary-600 text-sm"></i>
              <span className="text-xs font-semibold text-primary-600 tracking-[0.3px]">
                {t('payment.scanToPay', { defaultValue: 'Scan to pay' })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Coin + Amount */}
      <div className="mx-4 mb-3">
        <CoinAmountRow invoice={invoice} />
      </div>

      {/* Countdown timer */}
      {invoice.expiryAt && (
        <div
          className="mx-4 mb-4 p-3 rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--color-primary-600) 3%, var(--color-surface-0, #fff))',
            border: '1px solid color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
          }}
        >
          <Countdown expiryAt={invoice.expiryAt} />
        </div>
      )}
    </Card>
  )
}

// ─── Internal Countdown (compact, no card wrapper) ───
function Countdown({ expiryAt }) {
  const { t } = useTranslation()

  const calc = (expiry) => {
    const diff = new Date(expiry).getTime() - Date.now()
    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      expired: false,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    }
  }

  const [timeLeft, setTimeLeft] = useState(() => (expiryAt ? calc(expiryAt) : null))

  useEffect(() => {
    if (!expiryAt) return

    const id = setInterval(() => {
      const tl = calc(expiryAt)
      setTimeLeft(tl)
      if (tl.expired) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [expiryAt])

  if (!timeLeft || timeLeft.expired) return null

  const pad = (n) => String(n).padStart(2, '0')

  const segments = []
  if (timeLeft.days > 0) segments.push({ value: pad(timeLeft.days), label: t('time.days', { defaultValue: 'Days' }) })
  segments.push(
    { value: pad(timeLeft.hours), label: t('time.hours', { defaultValue: 'Hours' }) },
    { value: pad(timeLeft.minutes), label: t('time.minutes', { defaultValue: 'Minutes' }) },
    { value: pad(timeLeft.seconds), label: t('time.seconds', { defaultValue: 'Seconds' }) },
  )

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <i className="bx bx-time text-lg text-surface-400"></i>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[1px] text-surface-500">
            {t('payment.timeRemaining', { defaultValue: 'Time remaining' })}
          </span>
        </div>
        <div className="font-extrabold text-lg tracking-[2px] tabular-nums text-primary-600">
          {segments.map((seg) => seg.value).join(':')}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex-1 text-center">
            <span className="text-[10px] text-surface-400 font-medium">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
