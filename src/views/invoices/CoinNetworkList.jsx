import { useTranslation } from 'react-i18next'
import CoinImg, { NetworkIcon } from '../../components/CoinImg'

function CoinNetworkItem({ group, cn, isSelected, onSelect }) {
  const netName = cn.network?.name || ''
  const netSymbol = (cn.network?.symbol || '').toUpperCase()

  return (
    <div
      className="d-flex align-items-center gap-3 p-3 rounded-3 mb-2"
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(59, 130, 246, 0.12))'
          : 'rgba(255, 255, 255, 0.6)',
        border: isSelected
          ? '2px solid rgba(139, 92, 246, 0.4)'
          : '1px solid rgba(139, 92, 246, 0.1)',
        boxShadow: isSelected
          ? '0 4px 16px rgba(139, 92, 246, 0.15)'
          : '0 1px 3px rgba(0, 0, 0, 0.04)',
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
      }}
      onClick={() => onSelect(cn.id)}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.04)'
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.1)'
        }
      }}
    >
      <div className="position-relative" style={{ flexShrink: 0 }}>
        <CoinImg symbol={group.symbol} logoUrl={group.logoUrl} size={40} imgClassName="rounded-circle" />
        {netSymbol && (
          <div className="position-absolute" style={{
            bottom: -2, right: -2,
            background: 'white',
            borderRadius: '50%',
            padding: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <NetworkIcon networkSymbol={netSymbol} size={16} />
          </div>
        )}
      </div>

      <div className="flex-grow-1 min-width-0">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold" style={{
            fontSize: '0.95rem', color: 'var(--bs-heading-color)'
          }}>{group.symbol}</span>
          {group.isStableCoin ? (
            <span className="badge rounded-pill" style={{
              fontSize: '0.6rem',
              background: 'var(--bs-success)',
              color: 'white', fontWeight: 600
            }}>Stable</span>
          ) : null}
        </div>
        <div className="d-flex align-items-center gap-1">
          <span className="small" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.8rem' }}>
            {group.name}
          </span>
          {netName && (
            <>
              <span className="small" style={{ color: 'var(--bs-secondary-color)' }}>·</span>
              <span className="small" style={{ color: 'var(--bs-primary)', fontWeight: 600, fontSize: '0.75rem' }}>
                {netName}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {isSelected ? (
          <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, var(--bs-primary), var(--bs-info))',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
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
}

export default function CoinNetworkList({ filteredGroups, selectedCoinId, onSelect }) {
  const { t } = useTranslation()

  if (filteredGroups.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bx bx-coin" style={{ fontSize: 48, color: 'var(--bs-secondary-color)' }}></i>
        <p className="text-muted mt-2 mb-0 small">
          {t('payment.noCoinsFound', { defaultValue: 'No coins available' })}
        </p>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column gap-2">
      {filteredGroups.map((group) => (
        <div key={group.symbol}>
          {group.networks.map((cn) => (
            <CoinNetworkItem
              key={cn.id}
              group={group}
              cn={cn}
              isSelected={selectedCoinId === cn.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
