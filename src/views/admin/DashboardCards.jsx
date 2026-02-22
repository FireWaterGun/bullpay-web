import { formatCoinAmount } from '../../utils/format'

const cardStyle = {
  borderRadius: '0.75rem',
  border: 'none',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.2s, box-shadow 0.2s'
}

function handleMouseEnter(e) {
  e.currentTarget.style.transform = 'translateY(-4px)'
  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
}

function handleMouseLeave(e) {
  e.currentTarget.style.transform = 'translateY(0)'
  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
}

export function StatCard({ icon, color, value, label }) {
  return (
    <div className="col-lg-3 col-md-6">
      <div
        className="card h-100"
        style={cardStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '0.75rem',
              backgroundColor: `rgba(var(--bs-${color}-rgb), 0.08)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className={`bx ${icon}`} style={{ fontSize: '1.5rem', color: `var(--bs-${color})` }}></i>
            </div>
          </div>
          <h4 className="mb-1" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
            {value}
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

export function DailyTrendCard({ date, currencies, isToday }) {
  const totalTxn = Object.values(currencies).reduce((sum, d) => sum + d.count, 0)
  return (
    <div
      style={{
        minWidth: 280,
        padding: '1.25rem',
        borderRadius: '0.75rem',
        backgroundColor: isToday ? 'var(--bs-primary)' : 'var(--bs-gray-200)',
        color: isToday ? 'var(--bs-white)' : 'inherit',
        flexShrink: 0
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: isToday ? 'rgba(255,255,255,0.9)' : 'var(--bs-heading-color)'
        }}>
          {date}
        </span>
        <span style={{
          fontSize: '0.6875rem',
          padding: '0.125rem 0.5rem',
          borderRadius: '1rem',
          backgroundColor: isToday ? 'rgba(255,255,255,0.2)' : 'var(--bs-gray-300)'
        }}>
          {totalTxn}
        </span>
      </div>
      <div className="mt-2">
        <div
          className="d-flex justify-content-between mb-1"
          style={{
            fontSize: '0.6875rem',
            opacity: 0.7,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <span style={{ width: '40%' }}>Coin</span>
          <span style={{ width: '25%', textAlign: 'center' }}>Txn</span>
          <span style={{ width: '35%', textAlign: 'right' }}>Volume</span>
        </div>
        {Object.entries(currencies).map(([currency, data]) => (
          <div
            key={currency}
            className="d-flex justify-content-between align-items-center"
            style={{
              padding: '0.25rem 0',
              fontSize: '0.8125rem'
            }}
          >
            <span style={{ width: '40%', color: isToday ? 'rgba(255,255,255,0.95)' : 'var(--bs-heading-color)' }}>{currency}</span>
            <span style={{ width: '25%', textAlign: 'center', color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--bs-secondary-color)' }}>{data.count}</span>
            <span style={{ width: '35%', textAlign: 'right', fontWeight: 500 }}>
              {formatCoinAmount(data.volume, 4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
