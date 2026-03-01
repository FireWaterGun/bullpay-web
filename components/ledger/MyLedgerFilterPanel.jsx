'use client'

import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'

export default function MyLedgerFilterPanel({
  entryCodeFilter, setEntryCodeFilter,
  stateFilter, setStateFilter,
  coinNetworkIdFilter, setCoinNetworkIdFilter,
  datePresetFilter, setDatePresetFilter,
  txHashFilter, setTxHashFilter,
  coinNetworks,
  loading,
  onApply,
  onReset,
}) {
  const { t } = useTranslation()

  return (
    <div className="card-body">
      <div className="row g-3">
        <div className="col-md-3 col-sm-6">
          <label className="form-label">{t('filter.entryCode', { defaultValue: 'Entry Code' })}</label>
          <select className="form-select" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="DP">DP - {t('userLedger.code.DP', { defaultValue: 'Deposit' })}</option>
            <option value="WA">WA - {t('userLedger.code.WA', { defaultValue: 'Withdrawal Amount' })}</option>
            <option value="WF">WF - {t('userLedger.code.WF', { defaultValue: 'Withdrawal Fee' })}</option>
            <option value="WR">WR - {t('userLedger.code.WR', { defaultValue: 'Withdrawal Reversal' })}</option>
            <option value="FR">FR - {t('userLedger.code.FR', { defaultValue: 'Fee Revenue' })}</option>
            <option value="XI">XI - {t('userLedger.code.XI', { defaultValue: 'Internal Transfer In' })}</option>
            <option value="XO">XO - {t('userLedger.code.XO', { defaultValue: 'Internal Transfer Out' })}</option>
          </select>
        </div>
        <div className="col-md-3 col-sm-6">
          <label className="form-label">{t('filter.state', { defaultValue: 'State' })}</label>
          <select className="form-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="committed">{t('filter.committed', { defaultValue: 'Committed' })}</option>
            <option value="settled">{t('filter.settled', { defaultValue: 'Settled' })}</option>
            <option value="reversed">{t('filter.reversed', { defaultValue: 'Reversed' })}</option>
          </select>
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
          <label className="form-label">{t('filter.txHash', { defaultValue: 'Tx Hash' })}</label>
          <input type="text" className="form-control" placeholder={t('filter.txHash', { defaultValue: 'Tx Hash' })} value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
        </div>
        <div className="col-md-3 col-sm-6">
          <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
          <select className="form-select" value={datePresetFilter} onChange={(e) => setDatePresetFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="today">{t('filter.today', { defaultValue: 'Today' })}</option>
            <option value="yesterday">{t('filter.yesterday', { defaultValue: 'Yesterday' })}</option>
            <option value="last7">{t('filter.last7days', { defaultValue: 'Last 7 Days' })}</option>
            <option value="last30">{t('filter.last30days', { defaultValue: 'Last 30 Days' })}</option>
            <option value="thisMonth">{t('filter.thisMonth', { defaultValue: 'This Month' })}</option>
            <option value="lastMonth">{t('filter.lastMonth', { defaultValue: 'Last Month' })}</option>
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
  )
}
