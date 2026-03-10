'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import Button from '../ui/Button'
import { Input, Label, Select } from '../ui/Input'

export default function RbfTransactionFilters({
  statusFilter,
  setStatusFilter,
  entityTypeFilter,
  setEntityTypeFilter,
  chainTypeFilter,
  setChainTypeFilter,
  txHashFilter,
  setTxHashFilter,
  fromAddressFilter,
  setFromAddressFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
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
            <option value="broadcasted">Broadcasted</option>
            <option value="mempool">Mempool</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
            <option value="dropped">Dropped</option>
            <option value="replaced">Replaced</option>
          </Select>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.entityType', { defaultValue: 'Entity Type' })}</Label>
          <Select value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="sweep">Sweep</option>
            <option value="withdrawal">Withdrawal</option>
          </Select>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('filter.chainType', { defaultValue: 'Chain Type' })}</Label>
          <Select value={chainTypeFilter} onChange={(e) => setChainTypeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="evm">EVM</option>
            <option value="bitcoin">Bitcoin</option>
            <option value="solana">Solana</option>
            <option value="tron">Tron</option>
          </Select>
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
          <Label>{t('filter.fromAddress', { defaultValue: 'From Address' })}</Label>
          <Input
            type="text"
            placeholder="0x..."
            value={fromAddressFilter}
            onChange={(e) => setFromAddressFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
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
