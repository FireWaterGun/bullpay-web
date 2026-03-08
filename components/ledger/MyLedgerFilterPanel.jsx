'use client'

import { useTranslation } from 'react-i18next'
import CoinNetworkFilterDropdown from '@/components/ui/CoinNetworkFilterDropdown'
import Button from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'

export default function MyLedgerFilterPanel({
  entryCodeFilter,
  setEntryCodeFilter,
  stateFilter,
  setStateFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  datePresetFilter,
  setDatePresetFilter,
  txHashFilter,
  setTxHashFilter,
  coinNetworks,
  loading,
  onApply,
  onReset,
}) {
  const { t } = useTranslation()

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label>{t('filter.entryCode', { defaultValue: 'Entry Code' })}</Label>
          <Select value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="DP">DP - {t('userLedger.code.DP', { defaultValue: 'Deposit' })}</option>
            <option value="WA">WA - {t('userLedger.code.WA', { defaultValue: 'Withdrawal Amount' })}</option>
            <option value="WF">WF - {t('userLedger.code.WF', { defaultValue: 'Withdrawal Fee' })}</option>
            <option value="WR">WR - {t('userLedger.code.WR', { defaultValue: 'Withdrawal Reversal' })}</option>
            <option value="FR">FR - {t('userLedger.code.FR', { defaultValue: 'Fee Revenue' })}</option>
            <option value="XI">XI - {t('userLedger.code.XI', { defaultValue: 'Internal Transfer In' })}</option>
            <option value="XO">XO - {t('userLedger.code.XO', { defaultValue: 'Internal Transfer Out' })}</option>
          </Select>
        </div>
        <div>
          <Label>{t('filter.state', { defaultValue: 'State' })}</Label>
          <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="committed">{t('filter.committed', { defaultValue: 'Committed' })}</option>
            <option value="settled">{t('filter.settled', { defaultValue: 'Settled' })}</option>
            <option value="reversed">{t('filter.reversed', { defaultValue: 'Reversed' })}</option>
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
          <Label>{t('filter.txHash', { defaultValue: 'Tx Hash' })}</Label>
          <Input
            type="text"
            placeholder={t('filter.txHash', { defaultValue: 'Tx Hash' })}
            value={txHashFilter}
            onChange={(e) => setTxHashFilter(e.target.value)}
          />
        </div>
        <div>
          <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
          <Select value={datePresetFilter} onChange={(e) => setDatePresetFilter(e.target.value)}>
            <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
            <option value="today">{t('filter.today', { defaultValue: 'Today' })}</option>
            <option value="yesterday">{t('filter.yesterday', { defaultValue: 'Yesterday' })}</option>
            <option value="last7">{t('filter.last7days', { defaultValue: 'Last 7 Days' })}</option>
            <option value="last30">{t('filter.last30days', { defaultValue: 'Last 30 Days' })}</option>
            <option value="thisMonth">{t('filter.thisMonth', { defaultValue: 'This Month' })}</option>
            <option value="lastMonth">{t('filter.lastMonth', { defaultValue: 'Last Month' })}</option>
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
    </div>
  )
}

