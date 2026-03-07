'use client'

import { useTranslation } from 'react-i18next'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import Button from '../ui/Button'
import CoinNetworkFilterDropdown from '../ui/CoinNetworkFilterDropdown'
import { Input, Label, Select } from '../ui/Input'

export default function SystemLedgerFilters({
  locale,
  loading,
  coinNetworks,
  typeFilter,
  setTypeFilter,
  entryCodeFilter,
  setEntryCodeFilter,
  stateFilter,
  setStateFilter,
  walletIdFilter,
  setWalletIdFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  txHashFilter,
  setTxHashFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  onApply,
  onReset,
}) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-3">
      <div className="md:col-span-3 sm:col-span-6">
        <Label>{t('filter.entryType', { defaultValue: 'Entry Type' })}</Label>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
          <option value="credit">{t('filter.credit', { defaultValue: 'Credit' })}</option>
          <option value="debit">{t('filter.debit', { defaultValue: 'Debit' })}</option>
        </Select>
      </div>
      <div className="md:col-span-3 sm:col-span-6">
        <Label>{t('filter.entryCode', { defaultValue: 'Entry Code' })}</Label>
        <Select value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
          <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
          <option value="WA">WA - Wallet Actual</option>
          <option value="WF">WF - Wallet Fee</option>
          <option value="WG">WG - Wallet Gas</option>
          <option value="SP">SP - Settlement Payment</option>
          <option value="SG">SG - Sweep Gas</option>
          <option value="SC">SC - Sweep Cost</option>
          <option value="XI">XI - Internal In</option>
          <option value="XO">XO - Internal Out</option>
        </Select>
      </div>
      <div className="md:col-span-3 sm:col-span-6">
        <Label>{t('filter.state', { defaultValue: 'State' })}</Label>
        <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
          <option value="committed">{t('filter.committed', { defaultValue: 'Committed' })}</option>
          <option value="settled">{t('filter.settled', { defaultValue: 'Settled' })}</option>
          <option value="reversed">{t('filter.reversed', { defaultValue: 'Reversed' })}</option>
        </Select>
      </div>
      <div className="md:col-span-3 sm:col-span-6">
        <Label>{t('filter.walletId', { defaultValue: 'Wallet ID' })}</Label>
        <Input
          type="number"
          placeholder={t('filter.walletId', { defaultValue: 'Wallet ID' })}
          value={walletIdFilter}
          onChange={(e) => setWalletIdFilter(e.target.value)}
        />
      </div>
      <div className="md:col-span-3 sm:col-span-6">
        <Label>{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
        <CoinNetworkFilterDropdown
          coinNetworks={coinNetworks}
          value={coinNetworkIdFilter}
          onChange={setCoinNetworkIdFilter}
        />
      </div>
      <div className="md:col-span-3 sm:col-span-6">
        <Label>{t('filter.txHash', { defaultValue: 'Tx Hash' })}</Label>
        <Input
          type="text"
          placeholder={t('filter.txHash', { defaultValue: 'Tx Hash' })}
          value={txHashFilter}
          onChange={(e) => setTxHashFilter(e.target.value)}
        />
      </div>
      <div className="md:col-span-3 sm:col-span-6">
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
      <div className="col-span-12">
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
    </div>
  )
}
