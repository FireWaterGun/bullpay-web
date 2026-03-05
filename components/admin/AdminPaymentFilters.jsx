'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker';
import { Button, Input, Label, Select } from '../ui'

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
  onReset
}) {
  const { t } = useAdminTranslation();

  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.userId', { defaultValue: 'User ID' })}</Label>
          <Input type="number" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.invoiceId', { defaultValue: 'Invoice ID' })}</Label>
          <Input type="number" placeholder={t('filter.invoiceId', { defaultValue: 'Invoice ID' })} value={invoiceIdFilter} onChange={(e) => setInvoiceIdFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.txHash', { defaultValue: 'Tx Hash' })}</Label>
          <Input type="text" placeholder="0x..." value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
          <LocaleDateRangePicker className="w-full"
          startDate={fromDateFilter}
          endDate={toDateFilter}
          onChangeStart={setFromDateFilter}
          onChangeEnd={setToDateFilter}
          locale={locale}
          placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
          t={t} />

          
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.sortBy', { defaultValue: 'Sort By' })}</Label>
          <Select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
            <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
            <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
            <option value="amount_raw">{t('filter.amount', { defaultValue: 'Amount' })}</option>
            <option value="status">{t('filter.status', { defaultValue: 'Status' })}</option>
            <option value="confirmations">{t('filter.confirmations', { defaultValue: 'Confirmations' })}</option>
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</Label>
          <Select value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
            <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
            <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
            <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={onApply} disabled={loading}>
          <i className="bx bx-filter-alt mr-1"></i>
          {t('filter.apply', { defaultValue: 'Apply Filters' })}
        </Button>
        <Button onClick={onReset} disabled={loading} variant="outline-secondary">
          <i className="bx bx-reset mr-1"></i>
          {t('filter.reset', { defaultValue: 'Reset' })}
        </Button>
      </div>
    </div>);

}