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
          <div className="col-span-12 sm:col-span-6 md:col-span-2">
            <Label>{t('admin.detail.status', { defaultValue: 'Status' })}</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
              <option value="pending_verification">
                {t('wallet.status.pendingVerification', { defaultValue: 'Pending Verification' })}
              </option>
              <option value="active">{t('wallet.status.active', { defaultValue: 'Active' })}</option>
              <option value="suspended">{t('wallet.status.suspended', { defaultValue: 'Suspended' })}</option>
              <option value="deleted">{t('wallet.status.deleted', { defaultValue: 'Deleted' })}</option>
            </Select>
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-2">
            <Label>{t('admin.detail.userId', { defaultValue: 'User ID' })}</Label>
            <Input
              type="number"
              placeholder={t('filter.userId', { defaultValue: 'User ID' })}
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Label>{t('admin.detail.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
            <CoinNetworkFilterDropdown
              coinNetworks={coinNetworks}
              value={coinNetworkIdFilter}
              onChange={setCoinNetworkIdFilter}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-2">
            <Label>{t('admin.withdrawalAddress.flagged', { defaultValue: 'Flagged' })}</Label>
            <Select value={isFlaggedFilter} onChange={(e) => setIsFlaggedFilter(e.target.value)}>
              <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
              <option value="true">{t('admin.withdrawalAddress.flagged', { defaultValue: 'Flagged' })}</option>
              <option value="false">{t('admin.withdrawalAddress.notFlagged', { defaultValue: 'Not Flagged' })}</option>
            </Select>
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-2">
            <Label>{t('admin.withdrawalAddress.verified', { defaultValue: 'Verified' })}</Label>
            <Select value={isVerifiedFilter} onChange={(e) => setIsVerifiedFilter(e.target.value)}>
              <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
              <option value="true">{t('admin.withdrawalAddress.verified', { defaultValue: 'Verified' })}</option>
              <option value="false">
                {t('admin.withdrawalAddress.notVerified', { defaultValue: 'Not Verified' })}
              </option>
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
