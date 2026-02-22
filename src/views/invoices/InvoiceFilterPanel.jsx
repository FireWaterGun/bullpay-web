import { useTranslation } from 'react-i18next'
import CoinImg from '../../components/CoinImg'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'

export default function InvoiceFilterPanel({
  statusFilter, setStatusFilter,
  coinNetworkIdFilter, setCoinNetworkIdFilter,
  coinNetworks,
  startDateFilter, setStartDateFilter,
  endDateFilter, setEndDateFilter,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  locale,
  loading,
  onApply,
  onReset,
}) {
  const { t } = useTranslation()

  return (
    <div className="card-body">
      <form onSubmit={(e) => { e.preventDefault(); onApply() }}>
        <div className="row g-3">
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t("invoices.status")}</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("invoices.allStatus")}</option>
              <option value="pending">{t("invoices.pending")}</option>
              <option value="paid">{t("invoices.paid")}</option>
              <option value="expired">{t("invoices.expired")}</option>
            </select>
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</label>
            <CoinNetworkDropdown
              coinNetworks={coinNetworks}
              coinNetworkIdFilter={coinNetworkIdFilter}
              setCoinNetworkIdFilter={setCoinNetworkIdFilter}
            />
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
          <div className="col-md-3 col-sm-6">
            <label className="form-label">{t("invoices.sortBy")}</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">{t("invoices.dateCreated")}</option>
              <option value="amount">{t("invoices.amount")}</option>
              <option value="expiry_at">{t("invoices.expiryAt") || "Expiry date"}</option>
              <option value="paid_at">{t("invoices.paidAt") || "Paid date"}</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <i className="bx bx-filter-alt me-1"></i>
            {t("actions.applyFilters")}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onReset}
            disabled={loading}
          >
            <i className="bx bx-reset me-1"></i>
            {t("actions.reset")}
          </button>
        </div>
      </form>
    </div>
  )
}

function CoinNetworkDropdown({ coinNetworks, coinNetworkIdFilter, setCoinNetworkIdFilter }) {
  const { t } = useTranslation()
  const selected = coinNetworkIdFilter
    ? coinNetworks.find(c => String(c.id) === String(coinNetworkIdFilter))
    : null

  return (
    <div className="dropdown">
      <button
        className="form-select d-flex align-items-center justify-content-between"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{ textAlign: 'left' }}
      >
        {selected ? (
          <span className="d-flex align-items-center gap-2">
            <CoinImg
              symbol={(selected.coin?.symbol || '').toUpperCase()}
              networkSymbol={(selected.network?.symbol || '').toUpperCase()}
              size={22}
            />
            <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>
              {(selected.coin?.symbol || '').toUpperCase()}
            </span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {(selected.network?.symbol || '').toUpperCase()}
            </span>
          </span>
        ) : (
          <span className="text-muted">{t('filter.all', { defaultValue: 'All' })}</span>
        )}
      </button>
      <ul className="dropdown-menu w-100" style={{ maxHeight: '280px', overflowY: 'auto' }}>
        <li>
          <button type="button" className="dropdown-item" onClick={() => setCoinNetworkIdFilter('')}>
            <span className="text-muted">{t('filter.all', { defaultValue: 'All' })}</span>
          </button>
        </li>
        <li><hr className="dropdown-divider" /></li>
        {coinNetworks.map((cn) => {
          const sym = (cn.coin?.symbol || '').toUpperCase()
          const net = (cn.network?.symbol || '').toUpperCase()
          return (
            <li key={cn.id}>
              <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => setCoinNetworkIdFilter(String(cn.id))}>
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
  )
}
