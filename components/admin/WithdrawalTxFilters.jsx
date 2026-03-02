'use client'

import { useTranslation } from 'react-i18next'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import CoinImg from '@/components/CoinImg'
import RefreshButton from '@/components/RefreshButton'

export default function WithdrawalTxFilters({
  locale,
  loading,
  coinNetworks,
  statusFilter,
  setStatusFilter,
  userIdFilter,
  setUserIdFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  searchFilter,
  setSearchFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  onApply,
  onReset,
  onRefresh,
}) {
  const { t } = useTranslation()

  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-money-withdraw me-2"></i>
              {t('withdrawal.transactions', { defaultValue: 'Withdrawal' })}
            </h4>
            <p className="text-muted mb-0">
              {t('withdrawal.transactionsDesc', { defaultValue: 'View all withdrawal transactions and their status' })}
            </p>
          </div>
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
              <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
              <option value="waiting_for_gas">{t('status.waiting_for_gas', { defaultValue: 'Waiting for Gas' })}</option>
              <option value="processing">{t('status.processing', { defaultValue: 'Processing' })}</option>
              <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
              <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
              <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
            </select>
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
            <input type="number" className="form-control" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</label>
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
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t('filter.search', { defaultValue: 'Search' })}</label>
            <input type="text" className="form-control" placeholder={t('filter.searchPlaceholder', { defaultValue: 'tx_hash, address, email...' })} value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
            <LocaleDateRangePicker
              startDate={startDateFilter}
              endDate={endDateFilter}
              onChangeStart={setStartDateFilter}
              onChangeEnd={setEndDateFilter}
              locale={locale}
              placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
              t={t}
              style={{ width: '100%' }}
            />
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
