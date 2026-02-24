import { useTranslation } from 'react-i18next'
import CoinImg from '../../../components/CoinImg'
import { NetworkIcon } from '../../../components/CoinImg'
import { formatDuration } from './useInvoicePayment'

export default function NetworkSelectionPanel({
  paymentData, selectedNetwork, setSelectedNetwork, selectingNetwork,
  handleConfirmNetwork, isPaid, remainingMs, error
}) {
  const { t } = useTranslation()

  return (
    <div>
      {/* Network List */}
      <div className="d-flex flex-column" style={{ gap: 10 }}>
        {(paymentData?.availableNetworks || []).map((net) => {
          const isSelected = selectedNetwork === net.networkSymbol
          return (
            <div
              key={net.networkSymbol}
              className="d-flex align-items-center rounded-3"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '14px 16px',
                gap: 14,
                background: isSelected ? 'rgba(var(--bs-primary-rgb), 0.06)' : 'var(--bs-body-bg)',
                border: isSelected ? '2px solid rgba(var(--bs-primary-rgb), 0.4)' : '1.5px solid var(--bs-border-color)',
                boxShadow: isSelected ? '0 2px 12px rgba(var(--bs-primary-rgb), 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onClick={() => setSelectedNetwork(net.networkSymbol)}
            >
              {/* Icon in colored circle */}
              <div className="flex-shrink-0">
                <NetworkIcon networkSymbol={net.networkSymbol} size={44} />
              </div>

              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-bold" style={{ fontSize: '0.95rem', color: 'var(--bs-heading-color)', marginBottom: 3 }}>
                  {net.networkName}
                </div>
                <div className="d-flex align-items-center flex-wrap" style={{ gap: 6 }}>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, color: 'var(--bs-secondary-color)',
                    background: 'var(--bs-tertiary-bg)', padding: '2px 6px', borderRadius: 4,
                    letterSpacing: '0.3px', textTransform: 'uppercase', lineHeight: 1.4,
                  }}>{net.networkSymbol}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--bs-secondary-color)' }}>
                    · {net.confirmations} {t('payment.confirmations', { defaultValue: 'confirmations' })}
                  </span>
                </div>
              </div>

              {/* Radio */}
              <div style={{ flexShrink: 0 }}>
                {isSelected ? (
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                    width: 26, height: 26, background: 'var(--bs-primary)',
                    boxShadow: '0 2px 8px rgba(var(--bs-primary-rgb), 0.3)',
                  }}>
                    <i className="bx bx-check text-white" style={{ fontSize: 18 }}></i>
                  </div>
                ) : (
                  <div className="rounded-circle" style={{
                    width: 26, height: 26,
                    border: '2px solid var(--bs-border-color)',
                  }}></div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger mt-3 mb-0 py-2 small">{error}</div>
      )}

      {/* Continue Button */}
      <div className="mt-4">
        <button
          className="btn w-100 fw-bold d-flex align-items-center justify-content-center"
          disabled={!selectedNetwork || selectingNetwork}
          onClick={handleConfirmNetwork}
          style={{
            background: selectedNetwork
              ? 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 15%) 100%)'
              : 'var(--bs-tertiary-bg)',
            color: selectedNetwork ? '#fff' : 'var(--bs-secondary-color)',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            padding: '14px 24px',
            gap: 8,
            transition: 'all 0.2s ease',
            boxShadow: selectedNetwork ? '0 6px 20px rgba(var(--bs-primary-rgb), 0.35)' : 'none',
          }}
        >
          {selectingNetwork ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : (
            <i className="bx bx-right-arrow-alt" style={{ fontSize: 22 }}></i>
          )}
          {t('payment.confirmNetwork', { defaultValue: 'Continue' })}
        </button>
      </div>
    </div>
  )
}
