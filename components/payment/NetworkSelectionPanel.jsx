'use client'

import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { NetworkIcon } from '@/components/CoinImg'
import { formatDuration } from '@/components/payment/useInvoicePayment'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

export default function NetworkSelectionPanel({
  paymentData,
  selectedNetwork,
  setSelectedNetwork,
  selectingNetwork,
  handleConfirmNetwork,
  isPaid,
  remainingMs,
  error,
}) {
  const { t } = useTranslation()

  return (
    <div>
      {/* Network List */}
      <div className="flex flex-col gap-2.5">
        {(paymentData?.availableNetworks || []).map((net) => {
          const isSelected = selectedNetwork === net.networkSymbol
          return (
            <div
              key={net.networkSymbol}
              className="flex items-center rounded-xl cursor-pointer py-[14px] px-[16px] gap-[14px]"
              style={{
                transition: 'all 0.2s ease',
                background: isSelected
                  ? 'color-mix(in srgb, var(--color-primary-600) 6%, transparent)'
                  : 'var(--color-surface-0, #fff)',
                border: isSelected
                  ? '2px solid color-mix(in srgb, var(--color-primary-600) 40%, transparent)'
                  : '1.5px solid var(--color-surface-200)',
                boxShadow: isSelected
                  ? '0 2px 12px color-mix(in srgb, var(--color-primary-600) 12%, transparent)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onClick={() => setSelectedNetwork(net.networkSymbol)}
            >
              {/* Icon in colored circle */}
              <div className="shrink-0">
                <NetworkIcon networkSymbol={net.networkSymbol} size={44} />
              </div>

              <div className="grow min-w-0">
                <div className="font-bold text-[0.95rem] text-surface-900 mb-[3px]">{net.networkName}</div>
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[0.6rem] font-bold text-surface-500 bg-surface-100 py-[2px] px-[6px] rounded tracking-[0.3px] uppercase leading-[1.4]">
                    {net.networkSymbol}
                  </span>
                  <span className="text-xs text-surface-500">
                    · {net.confirmations} {t('payment.confirmations', { defaultValue: 'confirmations' })}
                  </span>
                </div>
              </div>

              {/* Radio */}
              <div className="shrink-0">
                {isSelected ? (
                  <div
                    className="flex items-center justify-center rounded-full bg-primary-600"
                    style={{
                      width: 26,
                      height: 26,
                      boxShadow: '0 2px 8px color-mix(in srgb, var(--color-primary-600) 30%, transparent)',
                    }}
                  >
                    <i className="bx bx-check text-white text-[18px]"></i>
                  </div>
                ) : (
                  <div
                    className="rounded-full"
                    style={{
                      width: 26,
                      height: 26,
                      border: '2px solid var(--color-surface-200)',
                    }}
                  ></div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-300 mt-3 mb-0 py-2 px-3 text-sm">
          {error}
        </div>
      )}

      {/* Continue Button */}
      <div className="mt-4">
        <Button
          disabled={!selectedNetwork || selectingNetwork}
          onClick={handleConfirmNetwork}
          style={{
            background: selectedNetwork
              ? 'linear-gradient(135deg, var(--color-primary-600) 0%, color-mix(in srgb, var(--color-primary-600), #000 15%) 100%)'
              : 'var(--color-surface-100)',
            color: selectedNetwork ? '#fff' : 'var(--color-surface-500)',
            transition: 'all 0.2s ease',
            boxShadow: selectedNetwork
              ? '0 6px 20px color-mix(in srgb, var(--color-primary-600) 35%, transparent)'
              : 'none',
          }}
          className="w-full font-bold flex items-center justify-center border-none rounded-xl text-[1rem] py-[14px] px-[24px] gap-2"
        >
          {selectingNetwork ? (
            <Spinner role="status" className="w-4 h-4" />
          ) : (
            <i className="bx bx-right-arrow-alt text-[22px]"></i>
          )}
          {t('payment.confirmNetwork', { defaultValue: 'Continue' })}
        </Button>
      </div>
    </div>
  )
}
