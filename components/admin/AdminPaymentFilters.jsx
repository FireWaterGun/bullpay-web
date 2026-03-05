'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'

export default function AdminPaymentFilters({
  locale,
  loading,
  statusFilter,
  setStatusFilter,
  userIdFilter,
  setUserIdFilter,
  invoiceIdFilter,
  setInvoiceIdFilter,
  txHashFilter,
  setTxHashFilter,
  fromDateFilter,
  setFromDateFilter,
  toDateFilter,
  setToDateFilter,
  sortByFilter,
  setSortByFilter,
  sortOrderFilter,
  setSortOrderFilter,
  onApply,
  onReset,
}) {
  const { t } = useAdminTranslation()

  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
          <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
            <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
            <option value="detecting">{t('status.detecting', { defaultValue: 'Detecting' })}</option>
            <option value="confirming">{t('status.confirming', { defaultValue: 'Confirming' })}</option>
            <option value="confirmed">{t('status.confirmed', { defaultValue: 'Confirmed' })}</option>
            <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
            <option value="expired">{t('status.expired', { defaultValue: 'Expired' })}</option>
            <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
            <option value="refunded">{t('status.refunded', { defaultValue: 'Refunded' })}</option>
            <option value="unconfirmed">{t('status.unconfirmed', { defaultValue: 'Unconfirmed' })}</option>
          </select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
          <input type="number" className="form-input" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.invoiceId', { defaultValue: 'Invoice ID' })}</label>
          <input type="number" className="form-input" placeholder={t('filter.invoiceId', { defaultValue: 'Invoice ID' })} value={invoiceIdFilter} onChange={(e) => setInvoiceIdFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.txHash', { defaultValue: 'Tx Hash' })}</label>
          <input type="text" className="form-input" placeholder="0x..." value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
          <LocaleDateRangePicker
            startDate={fromDateFilter}
            endDate={toDateFilter}
            onChangeStart={setFromDateFilter}
            onChangeEnd={setToDateFilter}
            locale={locale}
            placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
            t={t}
            style={{ width: '100%' }}
          />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
          <select className="form-input" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
            <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
            <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
            <option value="amount_raw">{t('filter.amount', { defaultValue: 'Amount' })}</option>
            <option value="status">{t('filter.status', { defaultValue: 'Status' })}</option>
            <option value="confirmations">{t('filter.confirmations', { defaultValue: 'Confirmations' })}</option>
          </select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <label className="form-label">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
          <select className="form-input" value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
            <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
            <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
            <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
          </select>
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
