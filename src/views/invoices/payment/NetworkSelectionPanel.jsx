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
      <div className="d-flex flex-column gap-2">
        {(paymentData?.availableNetworks || []).map((net) => {
          const isSelected = selectedNetwork === net.networkSymbol
          return (
            <div
              key={net.networkSymbol}
              className="d-flex align-items-center gap-3 rounded-3"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '12px 14px',
                background: isSelected
                  ? 'rgba(var(--bs-primary-rgb), 0.07)'
                  : 'transparent',
                border: isSelected
                  ? '1.5px solid rgba(var(--bs-primary-rgb), 0.35)'
                  : '1.5px solid var(--bs-border-color)',
              }}
              onClick={() => setSelectedNetwork(net.networkSymbol)}
            >
              <NetworkIcon networkSymbol={net.networkSymbol} size={36} />
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--bs-heading-color)' }}>
                  {net.networkName}
                </div>
                <div style={{ color: 'var(--bs-secondary-color)', fontSize: '0.72rem' }}>
                  {net.networkSymbol} · {net.confirmations} {t('payment.confirmations', { defaultValue: 'confirmations' })}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {isSelected ? (
                  <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                    width: 22, height: 22,
                    background: 'var(--bs-primary)',
                  }}>
                    <i className="bx bx-check text-white" style={{ fontSize: 16 }}></i>
                  </div>
                ) : (
                  <div className="rounded-circle" style={{
                    width: 22, height: 22,
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

      {/* Confirm Button */}
      <div className="mt-3">
        <button
          className="btn w-100 fw-semibold"
          disabled={!selectedNetwork || selectingNetwork}
          onClick={handleConfirmNetwork}
          style={{
            background: selectedNetwork
              ? 'var(--bs-primary)'
              : 'var(--bs-tertiary-bg)',
            color: selectedNetwork ? 'white' : 'var(--bs-secondary-color)',
            border: 'none',
            borderRadius: 10,
            fontSize: '0.9rem',
            padding: '12px 20px',
            transition: 'all 0.2s ease',
            boxShadow: selectedNetwork
              ? '0 4px 14px rgba(var(--bs-primary-rgb), 0.3)'
              : 'none',
          }}
        >
          {selectingNetwork ? (
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          ) : (
            <i className="bx bx-right-arrow-alt me-1" style={{ fontSize: 18 }}></i>
          )}
          {t('payment.confirmNetwork', { defaultValue: 'Continue' })}
        </button>
      </div>
    </div>
  )
}
