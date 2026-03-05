'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CoinImg from '@/components/CoinImg';
import { Button, Input, Label, Select, inputClass } from '../ui';

export default function MyLedgerFilterPanel({
  entryCodeFilter, setEntryCodeFilter,
  stateFilter, setStateFilter,
  coinNetworkIdFilter, setCoinNetworkIdFilter,
  datePresetFilter, setDatePresetFilter,
  txHashFilter, setTxHashFilter,
  coinNetworks,
  loading,
  onApply,
  onReset
}) {
  const { t } = useTranslation();

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
          <CoinNetworkDropdown
            coinNetworks={coinNetworks}
            coinNetworkIdFilter={coinNetworkIdFilter}
            setCoinNetworkIdFilter={setCoinNetworkIdFilter} />
          
        </div>
        <div>
          <Label>{t('filter.txHash', { defaultValue: 'Tx Hash' })}</Label>
          <Input type="text" placeholder={t('filter.txHash', { defaultValue: 'Tx Hash' })} value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
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
    </div>);

}

function CoinNetworkDropdown({ coinNetworks, coinNetworkIdFilter, setCoinNetworkIdFilter }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className={`${inputClass()} w-full flex items-center justify-between text-left`}
        type="button"
        onClick={() => setOpen(!open)}>
        
        {coinNetworkIdFilter ? (() => {
          const cn = coinNetworks.find((c) => String(c.id) === String(coinNetworkIdFilter));
          if (!cn) return t('common.all', { defaultValue: 'All' });
          const sym = (cn.coin?.symbol || '').toUpperCase();
          const net = (cn.network?.symbol || '').toUpperCase();
          return (
            <span className="flex items-center gap-2">
              <CoinImg symbol={sym} networkSymbol={net} size={22} />
              <span className="font-semibold text-[0.85rem]">{sym}</span>
              <span className="text-surface-500 text-xs">{net}</span>
            </span>);

        })() : <span className="text-surface-500">{t('common.all', { defaultValue: 'All' })}</span>}
        <i className={`bx bx-chevron-${open ? 'up' : 'down'} text-surface-400`}></i>
      </button>
      {open &&
      <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-200 bg-white shadow-lg max-h-[280px] overflow-y-auto">
          <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-50 text-sm text-surface-500" onClick={() => {setCoinNetworkIdFilter('');setOpen(false);}}>
            {t('common.all', { defaultValue: 'All' })}
          </button>
          <hr className="border-surface-200" />
          {coinNetworks.map((cn) => {
          const sym = (cn.coin?.symbol || '').toUpperCase();
          const net = (cn.network?.symbol || '').toUpperCase();
          return (
            <button type="button" key={cn.id} className="w-full text-left px-3 py-2 hover:bg-surface-50 flex items-center gap-2" onClick={() => {setCoinNetworkIdFilter(String(cn.id));setOpen(false);}}>
                <CoinImg symbol={sym} networkSymbol={net} size={28} />
                <div>
                  <div className="font-semibold text-[0.85rem]">{sym}</div>
                  <div className="text-surface-500 text-[0.7rem]">{net}</div>
                </div>
              </button>);

        })}
        </div>
      }
    </div>);

}