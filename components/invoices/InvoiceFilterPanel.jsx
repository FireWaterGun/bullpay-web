'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CoinImg from '@/components/CoinImg';
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker';
import { Button, Label, Select, inputClass } from '../ui';

export default function InvoiceFilterPanel({
  statusFilter, setStatusFilter,
  coinNetworkIdFilter, setCoinNetworkIdFilter,
  coinNetworks,
  startDateFilter, setStartDateFilter,
  endDateFilter, setEndDateFilter,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  locale,
  loading,
  onApply,
  onReset
}) {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <form onSubmit={(e) => {e.preventDefault();onApply();}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>{t("invoices.status")}</Label>
            <Select

              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              
              <option value="">{t("invoices.allStatus")}</option>
              <option value="pending">{t("invoices.pending")}</option>
              <option value="paid">{t("invoices.paid")}</option>
              <option value="expired">{t("invoices.expired")}</option>
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
          <div>
            <Label>{t("invoices.sortBy")}</Label>
            <Select

              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}>
              
              <option value="created_at">{t("invoices.dateCreated")}</option>
              <option value="amount">{t("invoices.amount")}</option>
              <option value="expiry_at">{t("invoices.expiryAt") || "Expiry date"}</option>
              <option value="paid_at">{t("invoices.paidAt") || "Paid date"}</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button type="submit" disabled={loading}>
            <i className="bx bx-filter-alt mr-1"></i>
            {t("actions.applyFilters")}
          </Button>
          <Button
            type="button"

            onClick={onReset}
            disabled={loading} variant="outline-secondary">
            
            <i className="bx bx-reset mr-1"></i>
            {t("actions.reset")}
          </Button>
        </div>
      </form>
    </div>);

}

function CoinNetworkDropdown({ coinNetworks, coinNetworkIdFilter, setCoinNetworkIdFilter }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = coinNetworkIdFilter ?
  coinNetworks.find((c) => String(c.id) === String(coinNetworkIdFilter)) :
  null;

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
        
        {selected ?
        <span className="flex items-center gap-2">
            <CoinImg
            symbol={(selected.coin?.symbol || '').toUpperCase()}
            networkSymbol={(selected.network?.symbol || '').toUpperCase()}
            size={22} />
          
            <span className="font-semibold text-[0.85rem]">
              {(selected.coin?.symbol || '').toUpperCase()}
            </span>
            <span className="text-surface-500 text-xs">
              {(selected.network?.symbol || '').toUpperCase()}
            </span>
          </span> :

        <span className="text-surface-500">{t('filter.all', { defaultValue: 'All' })}</span>
        }
        <i className={`bx bx-chevron-${open ? 'up' : 'down'} text-surface-400`}></i>
      </button>
      {open &&
      <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-200 bg-white shadow-lg max-h-[280px] overflow-y-auto">
          <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-50 text-sm text-surface-500" onClick={() => {setCoinNetworkIdFilter('');setOpen(false);}}>
            {t('filter.all', { defaultValue: 'All' })}
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