'use client';

import CoinImg from '@/components/CoinImg';
import RefreshButton from '@/components/RefreshButton';
import { Button, Card, Input, Label, Select, inputClass } from '../ui';

export default function AddressFilters({
  statusFilter,
  setStatusFilter,
  userIdFilter,
  setUserIdFilter,
  coinNetworkIdFilter,
  setCoinNetworkIdFilter,
  isFlaggedFilter,
  setIsFlaggedFilter,
  isVerifiedFilter,
  setIsVerifiedFilter,
  coinNetworks,
  loading,
  onApply,
  onReset,
  onRefresh,
  t
}) {
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-wallet mr-2"></i>
              {t('withdrawal.walletAddresses', { defaultValue: 'Wallet Addresses' })}
            </h4>
            <p className="text-muted mb-0">
              {t('withdrawal.walletAddressesDesc', { defaultValue: 'Manage user withdrawal wallet addresses' })}
            </p>
          </div>
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-12 gap-x-6 gap-3">
          <div className="md:col-span-2 sm:col-span-6">
            <Label>Status</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </Select>
          </div>
          <div className="md:col-span-2 sm:col-span-6">
            <Label>User ID</Label>
            <Input type="number" placeholder="User ID" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
          </div>
          <div className="md:col-span-3 sm:col-span-6">
            <Label>Coin / Network</Label>
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
          <div className="md:col-span-2 sm:col-span-6">
            <Label>Flagged</Label>
            <Select value={isFlaggedFilter} onChange={(e) => setIsFlaggedFilter(e.target.value)}>
              <option value="">All</option>
              <option value="true">Flagged</option>
              <option value="false">Not Flagged</option>
            </Select>
          </div>
          <div className="md:col-span-2 sm:col-span-6">
            <Label>Verified</Label>
            <Select value={isVerifiedFilter} onChange={(e) => setIsVerifiedFilter(e.target.value)}>
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
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
    </Card>);

}