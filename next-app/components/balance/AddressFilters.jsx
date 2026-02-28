'use client'

import CoinImg from '@/components/CoinImg'

export default function AddressFilters({
  statusFilter,
  setStatusFilter,
  userIdFilter,
  setUserIdFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  isFlaggedFilter,
  setIsFlaggedFilter,
  isVerifiedFilter,
  setIsVerifiedFilter,
  coinNetworks,
  loading,
  onApply,
  onReset,
  onRefresh,
  t,
}) {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-wallet me-2"></i>
              {t('withdrawal.walletAddresses', { defaultValue: 'Wallet Addresses' })}
            </h4>
            <p className="text-muted mb-0">
              {t('withdrawal.walletAddressesDesc', { defaultValue: 'Manage user withdrawal wallet addresses' })}
            </p>
          </div>
          <button className="btn btn-primary" onClick={onRefresh} disabled={loading}>
            <i className="bx bx-refresh me-1"></i>
            {t('actions.refresh', { defaultValue: 'Refresh' })}
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-2 col-sm-6">
            <label className="form-label">Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div className="col-md-2 col-sm-6">
            <label className="form-label">User ID</label>
            <input type="number" className="form-control" placeholder="User ID" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label">Coin / Network</label>
            <div className="dropdown">
              <button
                className="form-select d-flex align-items-center justify-content-between"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ textAlign: 'left' }}
              >
                {coinNetworkIdFilter ? (() => {
                  const cn = coinNetworks.find(c => String(c.id) === String(coinNetworkIdFilter))
                  if (!cn) return 'All'
                  const sym = (cn.coin?.symbol || '').toUpperCase()
                  const net = (cn.network?.symbol || '').toUpperCase()
                  return (
                    <span className="d-flex align-items-center gap-2">
                      <CoinImg symbol={sym} networkSymbol={net} size={22} />
                      <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{sym}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{net}</span>
                    </span>
                  )
                })() : <span className="text-muted">All</span>}
              </button>
              <ul className="dropdown-menu w-100" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <li>
                  <button className="dropdown-item" onClick={() => setCoinNetworkIdFilter('')}>
                    <span className="text-muted">All</span>
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                {coinNetworks.map((cn) => {
                  const sym = (cn.coin?.symbol || '').toUpperCase()
                  const net = (cn.network?.symbol || '').toUpperCase()
                  return (
                    <li key={cn.id}>
                      <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => setCoinNetworkIdFilter(String(cn.id))}>
                        <CoinImg symbol={sym} networkSymbol={net} size={28} />
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{sym}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{net}</div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div className="col-md-2 col-sm-6">
            <label className="form-label">Flagged</label>
            <select className="form-select" value={isFlaggedFilter} onChange={(e) => setIsFlaggedFilter(e.target.value)}>
              <option value="">All</option>
              <option value="true">Flagged</option>
              <option value="false">Not Flagged</option>
            </select>
          </div>
          <div className="col-md-2 col-sm-6">
            <label className="form-label">Verified</label>
            <select className="form-select" value={isVerifiedFilter} onChange={(e) => setIsVerifiedFilter(e.target.value)}>
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-primary" onClick={onApply} disabled={loading}>
            <i className="bx bx-filter-alt me-1"></i>
            {t('filter.apply', { defaultValue: 'Apply Filters' })}
          </button>
          <button className="btn btn-outline-secondary" onClick={onReset} disabled={loading}>
            <i className="bx bx-reset me-1"></i>
            {t('filter.reset', { defaultValue: 'Reset' })}
          </button>
        </div>
      </div>
    </div>
  )
}
