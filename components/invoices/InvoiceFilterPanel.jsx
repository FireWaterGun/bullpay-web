'use client'

import { useTranslation } from 'react-i18next'
import CoinNetworkFilterDropdown from '@/components/ui/CoinNetworkFilterDropdown'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import Button from '@/components/ui/Button'
import { Label, Select, Input } from '@/components/ui/Input'

export default function InvoiceFilterPanel({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  coinNetworks,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  locale,
  loading,
  onApply,
  onReset,
}) {
  const { t } = useTranslation()

  return (
    <div className="p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onApply()
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
            <Input
              type="text"
              placeholder={t('filter.searchInvoicePlaceholder', { defaultValue: 'Invoice number, address, pi_, in_...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label>{t('invoices.status')}</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{t('invoices.allStatus')}</option>
              <option value="pending">{t('invoices.pending')}</option>
              <option value="paid">{t('invoices.paid')}</option>
              <option value="expired">{t('invoices.expired')}</option>
            </Select>
          </div>
          <div>
            <Label>{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
            <CoinNetworkFilterDropdown
              coinNetworks={coinNetworks}
              value={coinNetworkIdFilter}
              onChange={setCoinNetworkIdFilter}
              allLabel={t('filter.all', { defaultValue: 'All' })}
            />
          </div>
          <div>
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
          <Button type="submit" disabled={loading}>
            <i className="bx bx-filter-alt mr-1"></i>
            {t('actions.applyFilters')}
          </Button>
          <Button type="button" onClick={onReset} disabled={loading} variant="outline-secondary">
            <i className="bx bx-reset mr-1"></i>
            {t('actions.reset')}
          </Button>
        </div>
      </form>
    </div>
  )
}

