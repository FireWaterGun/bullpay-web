'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import Button from '../ui/Button'
import { Input, Label, Select } from '../ui/Input'

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
  onApply,
  onReset,
}) {
  const { t } = useAdminTranslation()

  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
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
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.userId', { defaultValue: 'User ID' })}</Label>
          <Input
            type="number"
            placeholder={t('filter.userId', { defaultValue: 'User ID' })}
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.invoiceId', { defaultValue: 'Invoice ID' })}</Label>
          <Input
            type="number"
            placeholder={t('filter.invoiceId', { defaultValue: 'Invoice ID' })}
            value={invoiceIdFilter}
            onChange={(e) => setInvoiceIdFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.txHash', { defaultValue: 'Tx Hash' })}</Label>
          <Input
            type="text"
            placeholder="0x..."
            value={txHashFilter}
            onChange={(e) => setTxHashFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
          <LocaleDateRangePicker
            className="w-full"
            startDate={fromDateFilter}
            endDate={toDateFilter}
            onChangeStart={setFromDateFilter}
            onChangeEnd={setToDateFilter}
            locale={locale}
            placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
            t={t}
          />
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
    </div>
  )
}
