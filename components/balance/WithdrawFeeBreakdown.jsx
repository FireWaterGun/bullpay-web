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
      <div className="border rounded-lg p-3">
        <div className="text-sm text-surface-500 mb-2">{t('balance.feeBreakdown', { defaultValue: 'Fee Breakdown' })}</div>
        <div className="flex justify-between mb-2">
          <span className="text-sm">{t('balance.withdrawAmount', { defaultValue: 'Withdraw amount' })}</span>
          <span className="text-sm font-medium">{feeEstimate.display?.grossAmount || feeEstimate.display?.amount || `${formatCoinAmount(fromRaw(feeEstimate.amountRaw, feeEstimate.decimals), 4)} ${sym}`}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm">{t('balance.networkFee', { defaultValue: 'Network fee' })}</span>
          <span className="text-sm">{feeEstimate.display?.baseFee || `${formatCoinAmount(fromRaw(feeEstimate.baseFeeRaw, feeEstimate.decimals), 4)} ${sym}`}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm">{t('balance.platformFee', { defaultValue: 'Platform fee' })} ({feeEstimate.display?.percentFeeText || `${feeEstimate.feePercentage}%`})</span>
          <span className="text-sm">{feeEstimate.display?.percentFee || `${formatCoinAmount(fromRaw(feeEstimate.percentFeeRaw, feeEstimate.decimals), 4)} ${sym}`}</span>
        </div>
        <div className="flex justify-between mb-2 pt-2 border-t">
          <span className="text-sm">{t('balance.totalFee', { defaultValue: 'Total fee' })}</span>
          <div className="text-right">
            <div className="text-sm font-medium">{feeEstimate.display?.totalFee || `${formatCoinAmount(fromRaw(feeEstimate.totalFeeRaw, feeEstimate.decimals), 4)} ${sym}`}</div>
            {feeEstimate.displayUsd?.totalFeeUsd && (
              <div className="text-surface-500 text-xs">&asymp; {feeEstimate.displayUsd.totalFeeUsd}</div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-2 border-t">
          <span className="text-sm text-surface-500 flex items-center">
            {t('balance.total', { defaultValue: 'Total' })}
            <i
              className="bx bx-info-circle ml-1 cursor-pointer"
             
              title={t('balance.totalTooltip', { defaultValue: 'Amount you will receive after fees' })}
            ></i>
          </span>
          <div className="text-right">
            <div className="font-semibold">{feeEstimate.display?.netAmount || `${formatCoinAmount(fromRaw(feeEstimate.netAmountRaw, feeEstimate.decimals), 4)} ${sym}`}</div>
            {feeEstimate.displayUsd?.netAmountUsd && (
              <div className="text-surface-500 text-xs">&asymp; {feeEstimate.displayUsd.netAmountUsd}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
