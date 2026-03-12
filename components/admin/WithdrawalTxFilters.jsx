'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import RefreshButton from '@/components/RefreshButton'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CoinNetworkFilterDropdown from '@/components/ui/CoinNetworkFilterDropdown'
import { Input, Label, Select } from '@/components/ui/Input'

export default function WithdrawalTxFilters({
  locale,
  loading,
  coinNetworks,
  statusFilter,
  setStatusFilter,
  userIdFilter,
  setUserIdFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  searchFilter,
  setSearchFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  onApply,
  onReset,
  onRefresh,
}) {
  const { t } = useAdminTranslation()

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-money-withdraw mr-2"></i>
              {t('withdrawal.transactions', { defaultValue: 'Withdrawal' })}
            </h4>
            <p className="text-surface-500 mb-0">
              {t('withdrawal.transactionsDesc', { defaultValue: 'View all withdrawal transactions and their status' })}
            </p>
          </div>
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-12 gap-x-6 gap-3">
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
            <Input
              type="text"
              placeholder={t('filter.searchPlaceholder', { defaultValue: 'tx_hash, address, email...' })}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
              <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
              <option value="waiting_for_gas">
                {t('status.waiting_for_gas', { defaultValue: 'Waiting for Gas' })}
              </option>
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
    </Card>
  )
}
