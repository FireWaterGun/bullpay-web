'use client';

import { useTranslation } from 'react-i18next';
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker';
import { Button, CoinNetworkFilterDropdown, Input, Label, Select } from '../ui';

export default function PlatformLedgerFilterPanel({
  accountTypeFilter, setAccountTypeFilter,
  entryTypeFilter, setEntryTypeFilter,
  entryCodeFilter, setEntryCodeFilter,
  stateFilter, setStateFilter,
  coinNetworkIdFilter, setCoinNetworkIdFilter,
  txHashFilter, setTxHashFilter,
  startDateFilter, setStartDateFilter,
  endDateFilter, setEndDateFilter,
  coinNetworks,
  locale,
  loading,
  onApply,
  onReset
}) {
  const { t } = useTranslation();

  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="md:col-span-3 sm:col-span-6">
          <Label>Account Type</Label>
          <Select value={accountTypeFilter} onChange={(e) => setAccountTypeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
            <option value="adjustment">Adjustment</option>
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>Entry Type</Label>
          <Select value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>Entry Code</Label>
          <Select value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="WF">WF - Withdrawal Fee</option>
            <option value="FR">FR - Fee Refund</option>
            <option value="SG">SG - Sweep Gas Topup</option>
            <option value="SC">SC - Sweep Gas Cost</option>
            <option value="WG">WG - Withdrawal Gas</option>
            <option value="XI">XI - Internal Transfer In</option>
            <option value="XO">XO - Internal Transfer Out</option>
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>State</Label>
          <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">All</option>
            <option value="committed">Committed</option>
            <option value="settled">Settled</option>
            <option value="reversed">Reversed</option>
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>Coin / Network</Label>
          <CoinNetworkFilterDropdown
            coinNetworks={coinNetworks}
            value={coinNetworkIdFilter}
            onChange={setCoinNetworkIdFilter} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>Tx Hash</Label>
          <Input type="text" placeholder="Tx Hash" value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
          <LocaleDateRangePicker className="w-full"
          startDate={startDateFilter}
          endDate={endDateFilter}
          onChangeStart={setStartDateFilter}
          onChangeEnd={setEndDateFilter}
          locale={locale}
          placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
          t={t} />

          
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