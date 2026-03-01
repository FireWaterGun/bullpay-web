'use client'

import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'

export default function PlatformLedgerFilterPanel({
  accountTypeFilter, setAccountTypeFilter,
  entryTypeFilter, setEntryTypeFilter,
  entryCodeFilter, setEntryCodeFilter,
  stateFilter, setStateFilter,
  coinNetworkIdFilter, setCoinNetworkIdFilter,
  txHashFilter, setTxHashFilter,
  startDateFilter, setStartDateFilter,
  endDateFilter, setEndDateFilter,
  coinNetworks,
  locale,
  loading,
  onApply,
  onReset,
}) {
  const { t } = useTranslation()

  return (
    <div className="card-body">
      <div className="row g-3">
        <div className="col-md-3 col-sm-6">
          <label className="form-label">Account Type</label>
          <select className="form-select" value={accountTypeFilter} onChange={(e) => setAccountTypeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
        <div className="col-md-3 col-sm-6">
          <label className="form-label">Entry Type</label>
          <select className="form-select" value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>
        <div className="col-md-3 col-sm-6">
          <label className="form-label">Entry Code</label>
          <select className="form-select" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="WF">WF - Withdrawal Fee</option>
            <option value="FR">FR - Fee Refund</option>
            <option value="SG">SG - Sweep Gas Topup</option>
            <option value="SC">SC - Sweep Gas Cost</option>
            <option value="WG">WG - Withdrawal Gas</option>
            <option value="XI">XI - Internal Transfer In</option>
            <option value="XO">XO - Internal Transfer Out</option>
          </select>
        </div>
        <div className="col-md-3 col-sm-6">
          <label className="form-label">State</label>
          <select className="form-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">All</option>
            <option value="committed">Committed</option>
            <option value="settled">Settled</option>
            <option value="reversed">Reversed</option>
          </select>
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
        <div className="col-md-3 col-sm-6">
          <label className="form-label">Tx Hash</label>
          <input type="text" className="form-control" placeholder="Tx Hash" value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
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
  )
}
