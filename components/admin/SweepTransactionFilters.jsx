'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import Button from '../ui/Button'
import CoinNetworkFilterDropdown from '../ui/CoinNetworkFilterDropdown'
import { Input, Label, Select } from '../ui/Input'

export default function SweepTransactionFilters({
  statusFilter,
  setStatusFilter,
  userIdFilter,
  setUserIdFilter,
  fromAddressFilter,
  setFromAddressFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  coinNetworks,
  locale,
  loading,
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
            <option value="processing">{t('status.processing', { defaultValue: 'Processing' })}</option>
            <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
            <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
            <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
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
          <Label>{t('admin.sweep.fromAddress', { defaultValue: 'From Address' })}</Label>
          <Input
            type="text"
            placeholder={t('admin.sweep.fromAddressPlaceholder', { defaultValue: '0x...' })}
            value={fromAddressFilter}
            onChange={(e) => setFromAddressFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
          <CoinNetworkFilterDropdown
            coinNetworks={coinNetworks}
            value={coinNetworkIdFilter}
            onChange={setCoinNetworkIdFilter}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
          <LocaleDateRangePicker
            className="w-full"
            startDate={startDateFilter}
            endDate={endDateFilter}
            onChangeStart={setStartDateFilter}
            onChangeEnd={setEndDateFilter}
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
