import { useTranslation } from 'react-i18next'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'
import CoinImg from '../../components/CoinImg'

export default function SystemLedgerFilters({
  locale,
  loading,
  coinNetworks,
  typeFilter,
  setTypeFilter,
  entryCodeFilter,
  setEntryCodeFilter,
  stateFilter,
  setStateFilter,
  walletIdFilter,
  setWalletIdFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  txHashFilter,
  setTxHashFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  onApply,
  onReset,
}) {
  const { t } = useTranslation()

  return (
    <div className="row g-3">
      <div className="col-md-3 col-sm-6">
        <label className="form-label">{t('filter.entryType', { defaultValue: 'Entry Type' })}</label>
        <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
          <option value="credit">{t('filter.credit', { defaultValue: 'Credit' })}</option>
          <option value="debit">{t('filter.debit', { defaultValue: 'Debit' })}</option>
        </select>
      </div>
      <div className="col-md-3 col-sm-6">
        <label className="form-label">{t('filter.entryCode', { defaultValue: 'Entry Code' })}</label>
        <select className="form-select" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
          <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
          <option value="WA">WA - Wallet Actual</option>
          <option value="WF">WF - Wallet Fee</option>
          <option value="WG">WG - Wallet Gas</option>
          <option value="SP">SP - Settlement Payment</option>
          <option value="SG">SG - Sweep Gas</option>
          <option value="SC">SC - Sweep Cost</option>
          <option value="XI">XI - Internal In</option>
          <option value="XO">XO - Internal Out</option>
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
        <label className="form-label">{t('filter.walletId', { defaultValue: 'Wallet ID' })}</label>
        <input type="number" className="form-control" placeholder={t('filter.walletId', { defaultValue: 'Wallet ID' })} value={walletIdFilter} onChange={(e) => setWalletIdFilter(e.target.value)} />
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
      <div className="col-12">
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
