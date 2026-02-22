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
      {/* Merchant & Payment Info */}
      {paymentData?.merchantName && (
        <div className="text-center mb-2">
          <span className="small text-uppercase fw-semibold" style={{ color: 'var(--bs-secondary-color)', letterSpacing: '1px', fontSize: '0.7rem' }}>
            {t('payment.merchant', { defaultValue: 'Merchant' })}
          </span>
          <div className="fw-bold" style={{ fontSize: '1rem', color: 'var(--bs-heading-color)' }}>
            {paymentData.merchantName}
          </div>
        </div>
      )}

      {/* Amount & Coin */}
      <div className="mb-3 p-3 rounded-3 text-center" style={{
        background: 'linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.05), rgba(var(--bs-info-rgb), 0.05))',
        border: '1px solid rgba(var(--bs-primary-rgb), 0.15)'
      }}>
        <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
          <CoinImg symbol={paymentData?.coinSymbol} size={40} imgClassName="rounded-circle" />
          <div>
            <div style={{
              fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px',
              background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', lineHeight: 1.2
            }}>
              {paymentData?.amount} {paymentData?.coinSymbol}
            </div>
          </div>
        </div>
        {paymentData?.description && (
          <div className="small" style={{ color: 'var(--bs-secondary-color)' }}>{paymentData.description}</div>
        )}
      </div>

      {/* Timer */}
      {!isPaid && remainingMs !== undefined && (
        <div className="text-center mb-3 p-2 rounded-3" style={{
          background: remainingMs <= 60_000
            ? 'rgba(var(--bs-danger-rgb), 0.1)'
            : remainingMs <= 5 * 60_000
              ? 'rgba(var(--bs-warning-rgb), 0.1)'
              : 'rgba(var(--bs-primary-rgb), 0.08)',
          border: '1px solid rgba(var(--bs-primary-rgb), 0.15)'
        }}>
          <div className="d-flex align-items-center justify-content-center gap-2">
            <i className="bx bx-time" style={{ color: 'var(--bs-primary)', fontSize: 16 }}></i>
            <span className="small fw-semibold" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.75rem' }}>
              {t('payment.timeRemaining', { defaultValue: 'Time Remaining' })}
            </span>
            <span className="fw-bold" style={{
              color: remainingMs <= 60_000 ? 'var(--bs-danger)' : 'var(--bs-primary)',
              fontSize: '1.1rem', letterSpacing: '2px'
            }}>
              {formatDuration(remainingMs)}
            </span>
          </div>
        </div>
      )}

      {/* Select Network Label */}
      <div className="mb-2">
        <span className="small text-uppercase fw-bold" style={{
          color: 'var(--bs-secondary-color)', letterSpacing: '1.5px', fontSize: '0.7rem'
        }}>
          {t('payment.selectNetwork', { defaultValue: 'Select Network' })}
        </span>
      </div>

      {/* Network List */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        <div className="d-flex flex-column gap-2">
          {(paymentData?.availableNetworks || []).map((net) => {
            const isSelected = selectedNetwork === net.networkSymbol
            return (
              <div
                key={net.networkSymbol}
                className="d-flex align-items-center gap-3 p-3 rounded-3"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.12), rgba(var(--bs-info-rgb), 0.12))'
                    : 'rgba(var(--bs-white-rgb), 0.6)',
                  border: isSelected
                    ? '2px solid rgba(var(--bs-primary-rgb), 0.4)'
                    : '1px solid rgba(var(--bs-primary-rgb), 0.1)',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(var(--bs-primary-rgb), 0.15)'
                    : '0 1px 3px rgba(var(--bs-black-rgb), 0.04)',
                }}
                onClick={() => setSelectedNetwork(net.networkSymbol)}
              >
                <NetworkIcon networkSymbol={net.networkSymbol} size={32} />
                <div className="flex-grow-1">
                  <div className="fw-bold" style={{ fontSize: '0.95rem', color: 'var(--bs-heading-color)' }}>
                    {net.networkName}
                  </div>
                  <div className="small" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.75rem' }}>
                    {net.networkSymbol} · {net.confirmations} {t('payment.confirmations', { defaultValue: 'confirmations' })}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {isSelected ? (
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                      width: 28, height: 28,
                      background: 'linear-gradient(135deg, var(--bs-primary), var(--bs-info))',
                      boxShadow: '0 4px 12px rgba(var(--bs-primary-rgb), 0.4)'
                    }}>
                      <i className="bx bx-check text-white" style={{ fontSize: 18 }}></i>
                    </div>
                  ) : (
                    <div className="rounded-circle" style={{
                      width: 28, height: 28,
                      border: '2px solid var(--bs-border-color)'
                    }}></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger mt-3 mb-0 py-2 small">{error}</div>
      )}

      {/* Confirm Button */}
      <div className="mt-3">
        <button
          className="btn w-100 py-3 fw-bold"
          disabled={!selectedNetwork || selectingNetwork}
          onClick={handleConfirmNetwork}
          style={{
            background: selectedNetwork
              ? 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)'
              : 'var(--bs-border-color)',
            color: selectedNetwork ? 'white' : 'var(--bs-secondary-color)',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease',
            boxShadow: selectedNetwork
              ? '0 8px 24px rgba(var(--bs-primary-rgb), 0.4)'
              : 'none',
          }}
        >
          {selectingNetwork ? (
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          ) : (
            <i className="bx bx-check-circle me-2"></i>
          )}
          {t('payment.confirmNetwork', { defaultValue: 'Continue with Selected Network' })}
        </button>
      </div>
    </div>
  )
}
