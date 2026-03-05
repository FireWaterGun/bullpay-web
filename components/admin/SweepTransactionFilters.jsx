'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker';
import CoinImg from '@/components/CoinImg';
import { Button, Input, Label, Select, inputClass } from '../ui';

export default function SweepTransactionFilters({
  statusFilter, setStatusFilter,
  userIdFilter, setUserIdFilter,
  coinNetworkIdFilter, setCoinNetworkIdFilter,
  startDateFilter, setStartDateFilter,
  endDateFilter, setEndDateFilter,
  sortByFilter, setSortByFilter,
  sortOrderFilter, setSortOrderFilter,
  coinNetworks,
  locale,
  loading,
  onApply,
  onReset
}) {
  const { t } = useAdminTranslation();

  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
            <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
            <option value="processing">{t('status.processing', { defaultValue: 'Processing' })}</option>
            <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
            <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
            <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.userId', { defaultValue: 'User ID' })}</Label>
          <Input type="number" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
          <div className="dropdown">
            <button
              className={`${inputClass()} flex items-center justify-between text-left`}
              type="button"
              aria-expanded="false">

              
              {coinNetworkIdFilter ? (() => {
                const cn = coinNetworks.find((c) => String(c.id) === String(coinNetworkIdFilter));
                if (!cn) return 'All';
                const sym = (cn.coin?.symbol || '').toUpperCase();
                const net = (cn.network?.symbol || '').toUpperCase();
                return (
                  <span className="flex items-center gap-2">
                    <CoinImg symbol={sym} networkSymbol={net} size={22} />
                    <span className="font-semibold text-[0.85rem]">{sym}</span>
                    <span className="text-muted text-xs">{net}</span>
                  </span>);

              })() : <span className="text-muted">All</span>}
            </button>
            <ul className="absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1 w-full max-h-[280px] overflow-y-auto">
              <li>
                <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => setCoinNetworkIdFilter('')}>
                  <span className="text-muted">All</span>
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              {coinNetworks.map((cn) => {
                const sym = (cn.coin?.symbol || '').toUpperCase();
                const net = (cn.network?.symbol || '').toUpperCase();
                return (
                  <li key={cn.id}>
                    <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer flex items-center gap-2 py-2" onClick={() => setCoinNetworkIdFilter(String(cn.id))}>
                      <CoinImg symbol={sym} networkSymbol={net} size={28} />
                      <div>
                        <div className="font-semibold text-[0.85rem]">{sym}</div>
                        <div className="text-muted text-[0.7rem]">{net}</div>
                      </div>
                    </button>
                  </li>);

              })}
            </ul>
          </div>
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
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.sortBy', { defaultValue: 'Sort By' })}</Label>
          <Select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
            <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
            <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
            <option value="amount">{t('filter.amount', { defaultValue: 'Amount' })}</option>
            <option value="completed_at">{t('filter.completedAt', { defaultValue: 'Completed At' })}</option>
          </Select>
        </div>
        <div className="md:col-span-3 sm:col-span-6">
          <Label>{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</Label>
          <Select value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
            <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
            <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
            <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
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