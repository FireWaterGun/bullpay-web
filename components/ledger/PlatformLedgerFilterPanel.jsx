'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import Button from '../ui/Button'
import CoinNetworkFilterDropdown from '../ui/CoinNetworkFilterDropdown'
import { Input, Label, Select } from '../ui/Input'

export default function PlatformLedgerFilterPanel({
  accountTypeFilter,
  setAccountTypeFilter,
  entryTypeFilter,
  setEntryTypeFilter,
  entryCodeFilter,
  setEntryCodeFilter,
  stateFilter,
  setStateFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  txHashFilter,
  setTxHashFilter,
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
          <Label>{t('admin.platformLedger.accountType', { defaultValue: 'Account Type' })}</Label>
          <Select value={accountTypeFilter} onChange={(e) => setAccountTypeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="revenue">{t('admin.platformLedger.revenue', { defaultValue: 'Revenue' })}</option>
            <option value="expense">{t('admin.platformLedger.expense', { defaultValue: 'Expense' })}</option>
            <option value="adjustment">{t('admin.platformLedger.adjustment', { defaultValue: 'Adjustment' })}</option>
          </Select>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('admin.platformLedger.entryType', { defaultValue: 'Entry Type' })}</Label>
          <Select value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="credit">{t('admin.platformLedger.credit', { defaultValue: 'Credit' })}</option>
            <option value="debit">{t('admin.platformLedger.debit', { defaultValue: 'Debit' })}</option>
          </Select>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('admin.platformLedger.entryCode', { defaultValue: 'Entry Code' })}</Label>
          <Select value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="WF">WF - Withdrawal Fee</option>
            <option value="FR">FR - Fee Refund</option>
            <option value="SG">SG - Sweep Gas Topup</option>
            <option value="SC">SC - Sweep Gas Cost</option>
            <option value="WG">WG - Withdrawal Gas</option>
            <option value="XI">XI - Internal Transfer In</option>
            <option value="XO">XO - Internal Transfer Out</option>
          </Select>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('admin.platformLedger.state', { defaultValue: 'State' })}</Label>
          <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="committed">{t('admin.platformLedger.committed', { defaultValue: 'Committed' })}</option>
            <option value="settled">{t('admin.platformLedger.settled', { defaultValue: 'Settled' })}</option>
            <option value="reversed">{t('admin.platformLedger.reversed', { defaultValue: 'Reversed' })}</option>
          </Select>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('admin.platformLedger.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
          <CoinNetworkFilterDropdown
            coinNetworks={coinNetworks}
            value={coinNetworkIdFilter}
            onChange={setCoinNetworkIdFilter}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Label>{t('admin.platformLedger.txHash', { defaultValue: 'Tx Hash' })}</Label>
          <Input
            type="text"
            placeholder={t('admin.platformLedger.txHash', { defaultValue: 'Tx Hash' })}
            value={txHashFilter}
            onChange={(e) => setTxHashFilter(e.target.value)}
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
          <i className="bx bx-filter-alt mr-1" />
          {t('filter.apply', { defaultValue: 'Apply Filters' })}
        </Button>
        <Button onClick={onReset} disabled={loading} variant="outline-secondary">
          <i className="bx bx-reset mr-1" />
          {t('filter.reset', { defaultValue: 'Reset' })}
        </Button>
      </div>
    </div>
  )
}
