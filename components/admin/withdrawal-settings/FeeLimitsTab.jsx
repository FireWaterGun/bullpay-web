import CoinImg from '@/components/CoinImg'
import CardEmptyState from '@/components/CardEmptyState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import { formatAmount } from '@/lib/utils/settingsFormatters'

export default function FeeLimitsTab({
  t,
  cnSearch,
  setCnSearch,
  cnStatus,
  setCnStatus,
  loadCoinNetworks,
  cnLoading,
  coinNetworks,
  cnPagination,
  openCnEditModal,
}) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h5 className="text-lg font-semibold text-surface-800 mb-1">
              <i className="bx bx-table mr-2"></i>
              {t('admin.withdrawalSettings.perCoinNetworkTitle', { defaultValue: 'Per Coin-Network Fee & Limits' })}
            </h5>
            <p className="text-surface-500 mb-0 text-sm">
              {t('admin.withdrawalSettings.perCoinNetworkDesc', {
                defaultValue:
                  'Each row is a coin-network pair with its own withdrawal configuration. Click Edit to modify.',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={cnStatus}
              onChange={(e) => {
                setCnStatus(e.target.value)
                loadCoinNetworks(1, cnSearch, e.target.value)
              }}
              className="rounded-md border border-surface-200 dark:border-surface-300 bg-white dark:bg-surface-100 text-surface-800 text-sm px-2.5 py-[7px] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('admin.withdrawalSettings.statusAll', { defaultValue: 'All Status' })}</option>
              <option value="active">{t('admin.withdrawalSettings.statusActive', { defaultValue: 'Active' })}</option>
              <option value="inactive">{t('admin.withdrawalSettings.statusInactive', { defaultValue: 'Inactive' })}</option>
              <option value="maintenance">{t('admin.withdrawalSettings.statusMaintenance', { defaultValue: 'Maintenance' })}</option>
            </select>
            <div className="flex items-stretch text-sm w-[220px]">
              <Input
                type="text"
                placeholder={t('admin.withdrawalSettings.searchPlaceholder', {
                  defaultValue: 'Search coin/network...',
                })}
                value={cnSearch}
                onChange={(e) => setCnSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCoinNetworks(1, cnSearch, cnStatus)}
                className="rounded-r-none border-r-0"
              />
              <Button
                type="button"
                onClick={() => loadCoinNetworks(1, cnSearch, cnStatus)}
                variant="outline-primary"
                className="rounded-l-none"
              >
                <i className="bx bx-search"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        {cnLoading ? (
          <div className="text-center py-5">
            <Spinner role="status" className="text-primary" />
          </div>
        ) : coinNetworks.length === 0 ? (
          <CardEmptyState
            icon="bx-search-alt-2"
            message={t('admin.withdrawalSettings.noCoinNetworks', { defaultValue: 'No coin-networks found' })}
          />
        ) : (
          <Table responsive={false} className="mb-0">
            <thead>
              <tr>
                <th>{t('admin.withdrawalSettings.colCoinNetwork', { defaultValue: 'Coin / Network' })}</th>
                <th className="text-center">{t('admin.withdrawalSettings.colEnabled', { defaultValue: 'Enabled' })}</th>
                <th className="text-right">{t('admin.withdrawalSettings.colMin', { defaultValue: 'Min' })}</th>
                <th className="text-right">{t('admin.withdrawalSettings.colMax', { defaultValue: 'Max' })}</th>
                <th className="text-right">{t('admin.withdrawalSettings.colFeeBase', { defaultValue: 'Fee Base' })}</th>
                <th className="text-right">{t('admin.withdrawalSettings.colFeePercent', { defaultValue: 'Fee %' })}</th>
                <th className="text-right">
                  {t('admin.withdrawalSettings.colDailyLimit', { defaultValue: 'Daily Limit (USD)' })}
                </th>
                <th className="text-center">{t('admin.withdrawalSettings.colActions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {coinNetworks.map((cn) => {
                const coinSymbol = cn.coin?.symbol || '?'
                const networkSymbol = cn.network?.symbol || cn.network?.name || '?'
                return (
                  <tr key={cn.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} />
                        <div>
                          <span className="font-semibold">{coinSymbol}</span>
                          <small className="text-surface-500 ml-1">/ {networkSymbol}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <Badge color={cn.withdrawEnabled ? 'success' : 'secondary'} label>
                        {cn.withdrawEnabled ? 'ON' : 'OFF'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <code className="text-surface-800">{formatAmount(cn.minWithdrawAmount)}</code>
                    </td>
                    <td className="text-right">
                      <code className="text-surface-800">{formatAmount(cn.maxWithdrawAmount)}</code>
                    </td>
                    <td className="text-right">
                      <code className="text-surface-800">{formatAmount(cn.withdrawFeeBase)}</code>
                      {cn.withdrawFeeBase && cn.withdrawFeeBase !== '0' && (
                        <small className="text-surface-500 block text-xs">auto</small>
                      )}
                    </td>
                    <td className="text-right">
                      <code className="text-surface-800">
                        {cn.withdrawFeePercent ? `${cn.withdrawFeePercent}%` : '-'}
                      </code>
                    </td>
                    <td className="text-right">
                      <code className="text-surface-800">
                        {cn.dailyWithdrawLimitUsd ? `$${Number(cn.dailyWithdrawLimitUsd).toLocaleString()}` : '-'}
                      </code>
                    </td>
                    <td className="text-center">
                      <Button
                        type="button"
                        title={t('actions.edit', { defaultValue: 'Edit' })}
                        onClick={() => openCnEditModal(cn)}
                        variant="text-secondary"
                        size="icon-sm"
                      >
                        <i className="bx bx-edit text-[1rem]"></i>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="px-5 py-1.5">
        <Pagination pagination={cnPagination} onPageChange={(p) => loadCoinNetworks(p, cnSearch, cnStatus)} loading={cnLoading} />
      </div>
    </Card>
  )
}
