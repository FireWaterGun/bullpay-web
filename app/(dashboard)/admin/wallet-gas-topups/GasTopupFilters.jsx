'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import Button from '@/components/ui/Button'
import CoinNetworkFilterDropdown from '@/components/ui/CoinNetworkFilterDropdown'
import { Input, Label, Select } from '@/components/ui/Input'

export default function GasTopupFilters({
  coinNetworks,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  loading,
}) {
  const { t } = useAdminTranslation()
  const locale = useLocale()

  const set = (key, value) => onFiltersChange({ ...filters, [key]: value })

  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="col-span-12 sm:col-span-6 md:col-span-2">
          <Label>{t('common.status', { defaultValue: 'Status' })}</Label>
          <Select value={filters.status} onChange={(e) => set('status', e.target.value)}>
            <option value="">{t('common.all', { defaultValue: 'All' })}</option>
            <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
            <option value="processing">{t('status.processing', { defaultValue: 'Processing' })}</option>
            <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
            <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
            <option value="skipped">{t('admin.gasTopup.skipped', { defaultValue: 'Skipped' })}</option>
          </Select>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-2">
          <Label>{t('admin.gasTopup.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
          <CoinNetworkFilterDropdown
            coinNetworks={coinNetworks}
            value={filters.coinNetworkId}
            onChange={(v) => set('coinNetworkId', v)}
            allLabel={t('common.all', { defaultValue: 'All' })}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-2">
          <Label>{t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })}</Label>
          <Input
            type="number"
            min="1"
            placeholder={t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })}
            value={filters.sweepId}
            onChange={(e) => set('sweepId', e.target.value)}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-2">
          <Label>{t('admin.gasTopup.txHash', { defaultValue: 'Tx Hash' })}</Label>
          <Input
            type="text"
            placeholder="0x..."
            value={filters.txHash}
            onChange={(e) => set('txHash', e.target.value)}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
          <LocaleDateRangePicker
            className="w-full"
            startDate={filters.dateFrom}
            endDate={filters.dateTo}
            onChangeStart={(v) => set('dateFrom', v)}
            onChangeEnd={(v) => set('dateTo', v)}
            locale={locale}
            placeholder={t('admin.detail.selectDateRange', { defaultValue: 'Select date range' })}
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
