'use client'

import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { NetworkIcon } from '@/components/CoinImg'
import { formatDuration } from '@/components/payment/useInvoicePayment'

export default function NetworkSelectionPanel({
  paymentData, selectedNetwork, setSelectedNetwork, selectingNetwork,
  handleConfirmNetwork, isPaid, remainingMs, error
}) {
  const { t } = useTranslation()

  return (
    <div>
      {/* Network List */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        {(paymentData?.availableNetworks || []).map((net) => {
          const isSelected = selectedNetwork === net.networkSymbol
          return (
            <div
              key={net.networkSymbol}
              className="flex items-center rounded-lg"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '14px 16px',
                gap: 14,
                background: isSelected ? 'color-mix(in srgb, var(--color-primary-600) 6%, transparent)' : 'var(--color-surface-0, #fff)',
                border: isSelected ? '2px solid color-mix(in srgb, var(--color-primary-600) 40%, transparent)' : '1.5px solid var(--color-surface-200)',
                boxShadow: isSelected ? '0 2px 12px color-mix(in srgb, var(--color-primary-600) 12%, transparent)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onClick={() => setSelectedNetwork(net.networkSymbol)}
            >
              {/* Icon in colored circle */}
              <div className="shrink-0">
                <NetworkIcon networkSymbol={net.networkSymbol} size={44} />
              </div>

              <div className="grow" style={{ minWidth: 0 }}>
                <div className="font-bold" style={{ fontSize: '0.95rem', color: 'var(--color-surface-900)', marginBottom: 3 }}>
                  {net.networkName}
                </div>
                <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-surface-500)',
                    background: 'var(--color-surface-100)', padding: '2px 6px', borderRadius: 4,
                    letterSpacing: '0.3px', textTransform: 'uppercase', lineHeight: 1.4,
                  }}>{net.networkSymbol}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
                    · {net.confirmations} {t('payment.confirmations', { defaultValue: 'confirmations' })}
                  </span>
                </div>
              </div>

              {/* Radio */}
              <div style={{ flexShrink: 0 }}>
                {isSelected ? (
                  <div className="flex items-center justify-center rounded-full" style={{
                    width: 26, height: 26, background: 'var(--color-primary-600)',
                    boxShadow: '0 2px 8px color-mix(in srgb, var(--color-primary-600) 30%, transparent)',
                  }}>
                    <i className="bx bx-check text-white" style={{ fontSize: 18 }}></i>
                  </div>
                ) : (
                  <div className="rounded-full" style={{
                    width: 26, height: 26,
                    border: '2px solid var(--color-surface-200)',
                  }}></div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 mt-3 mb-0 py-2 px-3 text-sm">{error}</div>
      )}

      {/* Continue Button */}
      <div className="mt-4">
        <button
          className="btn w-full font-bold flex items-center justify-center"
          disabled={!selectedNetwork || selectingNetwork}
          onClick={handleConfirmNetwork}
          style={{
            background: selectedNetwork
              ? 'linear-gradient(135deg, var(--color-primary-600) 0%, color-mix(in srgb, var(--color-primary-600), #000 15%) 100%)'
              : 'var(--color-surface-100)',
            color: selectedNetwork ? '#fff' : 'var(--color-surface-500)',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            padding: '14px 24px',
            gap: 8,
            transition: 'all 0.2s ease',
            boxShadow: selectedNetwork ? '0 6px 20px color-mix(in srgb, var(--color-primary-600) 35%, transparent)' : 'none',
          }}
        >
          {selectingNetwork ? (
            <span className="spinner w-4 h-4 border-2" role="status"></span>
          ) : (
            <i className="bx bx-right-arrow-alt" style={{ fontSize: 22 }}></i>
          )}
          {t('payment.confirmNetwork', { defaultValue: 'Continue' })}
        </button>
      </div>
    </div>
  )
}
