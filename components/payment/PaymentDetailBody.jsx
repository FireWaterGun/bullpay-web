'use client'

import { useTranslation } from 'react-i18next'
import { NetworkIcon } from '@/components/CoinImg'
import CoinImg from '@/components/CoinImg'
import { formatAmount } from '@/lib/utils/format'
import { isSafeRedirectUrl } from '@/lib/utils/url'
import { formatDuration } from '@/components/payment/usePaymentBase'
import dynamic from 'next/dynamic'
import PaymentProgressSteps from '@/components/payment/PaymentProgressSteps'
const PaymentQRSection = dynamic(() => import('@/components/payment/PaymentQRSection'), { ssr: false })

// Static style constants (prevent object recreation per render)
const STYLE_PRIMARY_SUBTLE_BG = {
  background: 'color-mix(in srgb, var(--color-primary-600) 3%, var(--color-surface-0, #fff))',
}
const STYLE_SUCCESS_REDIRECT = {
  background: 'linear-gradient(135deg, #22c55e 0%, color-mix(in srgb, #22c55e, #000 20%) 100%)',
  boxShadow: '0 8px 24px color-mix(in srgb, #22c55e 40%, transparent)',
  transition: 'all 0.3s ease',
}

/**
 * Shared payment detail card body — used by both /pay and /invoice pages
 * after network is already selected (Step 2 / direct invoice).
 */
export default function PaymentDetailBody({
  invoice,
  isPaymentMode = false,
  coinSym,
  networkName,
  networkSym,
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
}) {
  const { t } = useTranslation()

  // ── Receipt Mode (paid) ──
  if (isPaid) {
    const amtStr = formatAmount(invoice.amount)
    const len = amtStr.length
    const fontSize = len > 14 ? '1rem' : len > 11 ? '1.2rem' : len > 8 ? '1.5rem' : '1.8rem'

    return (
      <div>
        {/* Merchant Name */}
        {invoice.merchantName && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-200">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-600/10">
              <i className="bx bx-store text-primary-600 text-[16px]"></i>
            </div>
            <div>
              <div className="text-[0.58rem] text-surface-400 uppercase tracking-[1px] font-semibold">
                {t('payment.payingTo', { defaultValue: 'Paying to' })}
              </div>
              <div className="text-[0.9rem] font-bold text-surface-900">{invoice.merchantName}</div>
            </div>
          </div>
        )}

        {/* Success Hero */}
        <div className="text-center mb-5">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 border-2 border-green-200 bg-green-50"
            style={{ animation: 'receiptPop 0.5s ease' }}
          >
            <i className="bx bx-check text-[28px] text-green-500"></i>
          </div>
          <h3 className="text-[1.1rem] font-bold text-surface-900 mb-2">
            {t('payment.paymentSuccessful', { defaultValue: 'Payment Successful' })}
          </h3>
          <div className="flex items-center justify-center gap-2 mb-1">
            <CoinImg
              symbol={coinSym}
              logoUrl={invoice?.coin?.logoUrl}
              networkSymbol={networkSym}
              networkName={networkName}
              size={32}
              imgClassName="rounded-full"
            />
            <span
              className="font-extrabold tracking-[-0.5px] text-primary-600 leading-[1]"
              style={{ fontSize }}
            >
              {amtStr}
            </span>
            <span className="text-[0.95rem] font-semibold text-surface-500 self-end pb-[2px]">{coinSym}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-primary-600/6 border border-primary-600/12 text-[0.7rem] font-semibold text-primary-600 uppercase tracking-[0.5px]">
            <NetworkIcon networkSymbol={networkSym} size={14} />
            {networkName || networkSym || 'Network'}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-surface-200 mb-3"></div>

        {/* Receipt Rows */}
        <div className="space-y-0">
          <div className="flex justify-between items-start py-2.5 border-b border-dashed border-surface-200/70">
            <span className="text-[0.7rem] text-surface-400 uppercase tracking-[1px] font-semibold shrink-0">
              {isPaymentMode ? t('payment.paymentId', { defaultValue: 'Payment ID' }) : t('invoices.invoice')}
            </span>
            <span className="text-[0.85rem] text-surface-900 font-medium text-right break-all max-w-[65%]">
              {isPaymentMode
                ? invoice.publicCode || invoice.id
                : `#${invoice.invoiceNumber || invoice.publicCode || invoice.id}`}
            </span>
          </div>

          {invoice.description && (
            <div className="flex justify-between items-start py-2.5 border-b border-dashed border-surface-200/70">
              <span className="text-[0.7rem] text-surface-400 uppercase tracking-[1px] font-semibold shrink-0">
                {t('invoices.description')}
              </span>
              <span className="text-[0.85rem] text-surface-900 font-medium text-right max-w-[65%]">
                {invoice.description}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start py-2.5">
            <span className="text-[0.7rem] text-surface-400 uppercase tracking-[1px] font-semibold shrink-0">
              {t('payment.network', { defaultValue: 'Network' })}
            </span>
            <span className="text-[0.85rem] text-surface-900 font-medium text-right">
              {networkName || networkSym || '-'}
            </span>
          </div>
        </div>

        {/* Paid At */}
        {invoice.paidAt && (
          <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-green-500/5 border border-green-500/15 mt-2">
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

        {/* Success Redirect */}
        {invoice?.successUrl && isSafeRedirectUrl(invoice.successUrl) && (
          <div className="mt-4">
            <a
              href={invoice.successUrl}
              className="w-full py-3 font-bold flex items-center justify-center gap-2 text-white border-none rounded-xl text-[1rem] tracking-[0.5px] no-underline"
              style={STYLE_SUCCESS_REDIRECT}
            >
              <i className="bx bx-check-circle text-[20px]"></i>
              {redirectCountdown != null
                ? `${t('payment.backToMerchant', { defaultValue: 'Redirecting' })} (${redirectCountdown}s)`
                : t('payment.backToMerchant', { defaultValue: 'Continue' })}
            </a>
          </div>
        )}

        <style>{`
          @keyframes receiptPop {
            0% { transform: scale(0.8); opacity: 0; }
            60% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ── Payment Mode (pending / expired) ──
  return (
    <div>
      {/* Merchant Name */}
      {invoice.merchantName && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-200">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-600/10">
            <i className="bx bx-store text-primary-600 text-[16px]"></i>
          </div>
          <div>
            <div className="text-[0.58rem] text-surface-400 uppercase tracking-[1px] font-semibold">
              {t('payment.payingTo', { defaultValue: 'Paying to' })}
            </div>
            <div className="text-[0.9rem] font-bold text-surface-900">{invoice.merchantName}</div>
          </div>
        </div>
      )}

      {/* Step Progress Indicator (payment mode only, hide when expired) */}
      {isPaymentMode && !isExpiredUnpaid && (
        <>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-white text-[0.7rem] font-bold w-[26px] h-[26px] bg-green-500"
              >
                <i className="bx bx-check text-[16px]"></i>
              </div>
              <span className="text-[0.85rem] font-medium text-surface-500">
                {t('payment.stepNetwork', { defaultValue: 'Network' })}
              </span>
            </div>
            <div
              className="flex-1 mx-[16px] h-px bg-primary-600"
            ></div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full bg-primary-600 text-white text-[0.7rem] font-bold w-[26px] h-[26px]"
              >
                2
              </div>
              <span className="text-[0.85rem] font-semibold text-surface-900">
                {t('payment.stepPayment', { defaultValue: 'Payment' })}
              </span>
            </div>
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.85rem] font-semibold text-surface-900">
              {t('payment.paymentDetails', { defaultValue: 'Payment Details' })}
            </span>
            <span className="text-xs text-surface-500">Step 2/2</span>
          </div>
        </>
      )}

      {/* Payment ID & Network Badge */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <div>
          <div className="text-[0.6rem] mb-0.5 text-surface-400 uppercase tracking-[1px] font-semibold">
            {isPaymentMode ? t('payment.paymentId', { defaultValue: 'Payment ID' }) : t('invoices.invoice')}
          </div>
          <div className="break-all text-[0.85rem] text-surface-600 font-medium">
            {isPaymentMode
              ? invoice.publicCode || invoice.id
              : `#${invoice.invoiceNumber || invoice.publicCode || invoice.id}`}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-600/6 border border-primary-600/15"
        >
          <NetworkIcon networkSymbol={networkSym} size={18} />
          <span className="font-semibold text-[0.7rem] text-primary-600 uppercase tracking-[0.5px]">
            {networkSym || 'N/A'}
          </span>
        </div>
      </div>

      {/* Timer - horizontal row (hide when expired) */}
      {!isExpiredUnpaid && remainingMs !== undefined && (
        <div className="mb-2">
          <div
            className="flex items-center justify-between p-3 rounded-xl border border-primary-600/10"
            style={STYLE_PRIMARY_SUBTLE_BG}
          >
            <div className="flex items-center gap-2">
              <i
                className="bx bx-time text-[20px]"
                style={{
                  color: remainingMs <= 60_000 ? '#ef4444' : 'var(--color-surface-500)',
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
              className="mt-1.5 h-[3px] rounded-full overflow-hidden bg-surface-200/60"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${timerPercent}%`,
                  background:
                    timerPercent <= 10 ? '#ef4444' : timerPercent <= 30 ? '#f59e0b' : 'var(--color-primary-600)',
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
          networkSym={networkSym}
          paymentValue={paymentValue}
          isPaid={false}
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
          <div>{t('payment.expiredMessage') || 'This invoice has expired. Please request a new payment link.'}</div>
        </div>
      )}

      {/* Payment Address */}
      {!isExpiredUnpaid && (
        <div className="mb-2">
          <div className="text-sm mb-2 text-surface-500 uppercase tracking-[1.5px] text-[0.65rem] font-semibold">
            {t('invoices.paymentAddress')}
          </div>
          <div
            className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200"
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
          className="mb-2 p-2.5 rounded-xl bg-surface-50 border border-surface-200"
        >
          <div className="text-sm mb-2 text-surface-500 uppercase tracking-[1px] text-[0.65rem] font-semibold">
            {t('invoices.description')}
          </div>
          <div className="text-surface-900 leading-[1.4] text-[0.875rem]">{invoice.description}</div>
        </div>
      )}

      {/* Progress Steps (hide when expired — redundant with banner + alert) */}
      {!isExpiredUnpaid && (
        <PaymentProgressSteps isPaid={false} isExpiredUnpaid={isExpiredUnpaid} currentStep={currentStep} />
      )}

      {/* Partial Payment Progress */}
      {hasPartial && (
        <div
          className="mb-2 p-2.5 rounded-xl border border-primary-600/12"
          style={STYLE_PRIMARY_SUBTLE_BG}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[1px] text-surface-500">
              {t('payment.amountReceived', { defaultValue: 'Amount received' })}
            </span>
            <span className="text-[0.78rem] font-bold text-primary-600">
              {formatAmount(invoice.paidAmount || '0')} / {formatAmount(invoice.amount)} {coinSym}
            </span>
          </div>
          <div className="h-[4px] rounded-full overflow-hidden bg-surface-200">
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
              {t('payment.remaining', { defaultValue: 'Remaining' })}:{' '}
              <span className="font-semibold text-surface-700">
                {formatAmount(invoice.remainingAmount)} {coinSym}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Network Warning */}
      {!isExpiredUnpaid && coinSym && networkName && (
        <div
          className="flex items-start gap-2 p-2.5 rounded-xl mt-2 bg-amber-500/8 border border-amber-500/25"
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
    </div>
  )
}
