'use client'

import RefreshButton from '@/components/RefreshButton'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CoinNetworkFilterDropdown from '@/components/ui/CoinNetworkFilterDropdown'
import { Input, Label, Select } from '@/components/ui/Input'

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
  t,
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
            <p className="text-surface-500 mb-0">
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
            <Input
              type="number"
              placeholder="User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 sm:col-span-6">
            <Label>Coin / Network</Label>
            <CoinNetworkFilterDropdown
              coinNetworks={coinNetworks}
              value={coinNetworkIdFilter}
              onChange={setCoinNetworkIdFilter}
            />
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
    </Card>
  )
}
