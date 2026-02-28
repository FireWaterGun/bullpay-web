'use client'

import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatCoinAmount } from '@/lib/utils/format'

function fromRaw(rawValue, decimals) {
  if (!rawValue || !decimals) return '0'
  try {
    return AmountNormalizer.fromRawSimple(rawValue, decimals)
  } catch {
    return '0'
  }
}

export default function WithdrawFeeBreakdown({ feeEstimate, sym, t }) {
  if (!feeEstimate) return null

  return (
    <div className="mb-3">
      <div className="border rounded-3 p-3">
        <div className="small text-muted mb-2">{t('balance.feeBreakdown', { defaultValue: 'Fee Breakdown' })}</div>
        <div className="d-flex justify-content-between mb-2">
          <span className="small">{t('balance.withdrawAmount', { defaultValue: 'Withdraw amount' })}</span>
          <span className="small fw-medium">{feeEstimate.display?.grossAmount || feeEstimate.display?.amount || `${formatCoinAmount(fromRaw(feeEstimate.amountRaw, feeEstimate.decimals), 4)} ${sym}`}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span className="small">{t('balance.networkFee', { defaultValue: 'Network fee' })}</span>
          <span className="small">{feeEstimate.display?.baseFee || `${formatCoinAmount(fromRaw(feeEstimate.baseFeeRaw, feeEstimate.decimals), 4)} ${sym}`}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span className="small">{t('balance.platformFee', { defaultValue: 'Platform fee' })} ({feeEstimate.display?.percentFeeText || `${feeEstimate.feePercentage}%`})</span>
          <span className="small">{feeEstimate.display?.percentFee || `${formatCoinAmount(fromRaw(feeEstimate.percentFeeRaw, feeEstimate.decimals), 4)} ${sym}`}</span>
        </div>
        <div className="d-flex justify-content-between mb-2 pt-2 border-top">
          <span className="small">{t('balance.totalFee', { defaultValue: 'Total fee' })}</span>
          <div className="text-end">
            <div className="small fw-medium">{feeEstimate.display?.totalFee || `${formatCoinAmount(fromRaw(feeEstimate.totalFeeRaw, feeEstimate.decimals), 4)} ${sym}`}</div>
            {feeEstimate.displayUsd?.totalFeeUsd && (
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>&asymp; {feeEstimate.displayUsd.totalFeeUsd}</div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-between mb-0 pt-2 border-top">
          <span className="small text-muted d-flex align-items-center">
            {t('balance.total', { defaultValue: 'Total' })}
            <i
              className="bx bx-info-circle ms-1"
              style={{ cursor: 'pointer' }}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-title={t('balance.totalTooltip', { defaultValue: 'Amount you will receive after fees' })}
            ></i>
          </span>
          <div className="text-end">
            <div className="fw-semibold">{feeEstimate.display?.netAmount || `${formatCoinAmount(fromRaw(feeEstimate.netAmountRaw, feeEstimate.decimals), 4)} ${sym}`}</div>
            {feeEstimate.displayUsd?.netAmountUsd && (
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>&asymp; {feeEstimate.displayUsd.netAmountUsd}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
