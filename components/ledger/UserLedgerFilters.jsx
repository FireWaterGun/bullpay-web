'use client'

import CoinImg from '@/components/CoinImg'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'

export default function UserLedgerFilters({
  t,
  locale,
  loading,
  typeFilter,
  setTypeFilter,
  entryCodeFilter,
  setEntryCodeFilter,
  stateFilter,
  setStateFilter,
  userIdFilter,
  setUserIdFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  coinNetworks,
  txHashFilter,
  setTxHashFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  onApply,
  onReset,
}) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.entryType', { defaultValue: 'Entry Type' })}</label>
          <select className="form-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="credit">{t('filter.credit', { defaultValue: 'Credit' })}</option>
            <option value="debit">{t('filter.debit', { defaultValue: 'Debit' })}</option>
          </select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.entryCode', { defaultValue: 'Entry Code' })}</label>
          <select className="form-input" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="DP">DP - Deposit</option>
            <option value="WA">WA - Wallet Actual</option>
            <option value="WF">WF - Wallet Fee</option>
            <option value="WR">WR - Wallet Refund</option>
            <option value="FR">FR - Fee Refund</option>
            <option value="XI">XI - Internal In</option>
            <option value="XO">XO - Internal Out</option>
          </select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.state', { defaultValue: 'State' })}</label>
          <select className="form-input" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="committed">{t('filter.committed', { defaultValue: 'Committed' })}</option>
            <option value="settled">{t('filter.settled', { defaultValue: 'Settled' })}</option>
            <option value="reversed">{t('filter.reversed', { defaultValue: 'Reversed' })}</option>
          </select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
          <input type="number" className="form-input" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</label>
          <CoinNetworkDropdown
            coinNetworks={coinNetworks}
            coinNetworkIdFilter={coinNetworkIdFilter}
            setCoinNetworkIdFilter={setCoinNetworkIdFilter}
          />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.txHash', { defaultValue: 'Tx Hash' })}</label>
          <input type="text" className="form-input" placeholder={t('filter.txHash', { defaultValue: 'Tx Hash' })} value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
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
      <div className="flex gap-2 mt-3">
        <button className="btn btn-primary" onClick={onApply} disabled={loading}>
          <i className="bx bx-filter-alt mr-1"></i>
          {t('filter.apply', { defaultValue: 'Apply Filters' })}
        </button>
        <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={onReset} disabled={loading}>
          <i className="bx bx-reset mr-1"></i>
          {t('filter.reset', { defaultValue: 'Reset' })}
        </button>
      </div>
    </div>
  )
}

function CoinNetworkDropdown({ coinNetworks, coinNetworkIdFilter, setCoinNetworkIdFilter }) {
  const selected = coinNetworkIdFilter
    ? coinNetworks.find(c => String(c.id) === String(coinNetworkIdFilter))
    : null

  return (
    <div className="dropdown">
      <button
        className="form-input flex items-center justify-between"
        type="button"
        aria-expanded="false"
        style={{ textAlign: 'left' }}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <CoinImg
              symbol={(selected.coin?.symbol || '').toUpperCase()}
              networkSymbol={(selected.network?.symbol || '').toUpperCase()}
              size={22}
            />
            <span className="font-semibold" style={{ fontSize: '0.85rem' }}>
              {(selected.coin?.symbol || '').toUpperCase()}
            </span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {(selected.network?.symbol || '').toUpperCase()}
            </span>
          </span>
        ) : (
          <span className="text-muted">All</span>
        )}
      </button>
      <ul className="absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1 w-full" style={{ maxHeight: '280px', overflowY: 'auto' }}>
        <li>
          <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => setCoinNetworkIdFilter('')}>
            <span className="text-muted">All</span>
          </button>
        </li>
        <li><hr className="dropdown-divider" /></li>
        {coinNetworks.map((cn) => {
          const sym = (cn.coin?.symbol || '').toUpperCase()
          const net = (cn.network?.symbol || '').toUpperCase()
          return (
            <li key={cn.id}>
              <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer flex items-center gap-2 py-2" onClick={() => setCoinNetworkIdFilter(String(cn.id))}>
                <CoinImg symbol={sym} networkSymbol={net} size={28} />
                <div>
                  <div className="font-semibold" style={{ fontSize: '0.85rem' }}>{sym}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>{net}</div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
