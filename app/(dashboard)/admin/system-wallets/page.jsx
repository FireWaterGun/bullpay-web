'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getSystemWalletStats } from '@/lib/api/admin'
import { formatAmount, formatUsd, formatCoinAmount } from '@/lib/utils/format'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import CoinImg from '@/components/CoinImg'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import CardEmptyState from '@/components/CardEmptyState'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Table from '@/components/ui/Table'

export default function SystemBalance() {
  const { t } = useAdminTranslation()
  const toast = useToast()

  const { data: stats, isLoading: loading, error: fetchError } = useApi(
    'system-wallet-stats',
    (token) => getSystemWalletStats(token, 'USD'),
    { onError: () => toast.error(t('admin.systemWallets.loadError', { defaultValue: 'Failed to load system wallet stats' })) }
  )

  const { copiedId, handleCopy: copyAddress } = useCopyFeedback()

  if (loading) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-6">
          <Spinner role="status" className="text-primary" />
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="grow pb-6">
        <Alert role="alert">
          <i className="bx bx-error-circle mr-2"></i>
          {fetchError?.message || 'Failed to load system wallet stats'}
        </Alert>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* System Balance Card */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-surface-800 mb-1">
                    {t('admin.systemBalance', { defaultValue: 'System Balance' })}
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-surface-500">
                  <span className="flex items-center gap-1.5">
                    <i className="bx bxs-wallet bx-sm text-info"></i>
                    {stats?.totalWallets || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="bx bxs-gas-pump bx-sm text-warning"></i>
                    {stats?.gasPurposeWallets || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="bx bxs-bank bx-sm text-primary"></i>
                    {stats?.treasuryPurposeWallets || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="text-5xl font-bold text-surface-900">{formatUsd(stats?.fiat?.totalValueUsd || 0)}</div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Badge color="primary" label>
                  <i className="bx bx-wallet mr-1"></i>
                  {stats?.walletsWithFunds || 0} {t('admin.walletsWithFunds', { defaultValue: 'wallets with funds' })}
                </Badge>
                <Badge color="success" label>
                  <i className="bx bx-check-circle mr-1"></i>
                  {t('admin.confirmedBalance', { defaultValue: 'Confirmed' })}:{' '}
                  {formatUsd(stats?.fiat?.confirmedValueUsd || 0)}
                </Badge>
                {parseFloat(stats?.fiat?.unconfirmedValueUsd || 0) > 0 && (
                  <Badge color="warning" label>
                    <i className="bx bx-time-five mr-1"></i>
                    {t('admin.unconfirmedBalance', { defaultValue: 'Unconfirmed' })}:{' '}
                    {formatUsd(stats?.fiat?.unconfirmedValueUsd || 0)}
                  </Badge>
                )}
                {parseFloat(stats?.fiat?.lockedValueUsd || 0) > 0 && (
                  <Badge color="danger" label>
                    <i className="bx bx-lock-alt mr-1"></i>
                    {t('admin.lockedBalance', { defaultValue: 'Locked' })}:{' '}
                    {formatUsd(stats?.fiat?.lockedValueUsd || 0)}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Wallet Details Table */}
          <Card>
            <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
              <h5 className="mb-0">{t('admin.walletDetails', { defaultValue: 'Wallet Details' })}</h5>
              <Badge color="primary" label>
                {stats?.balanceDetails?.length || 0} {t('admin.wallets', { defaultValue: 'wallets' })}
              </Badge>
            </div>
            {!stats?.balanceDetails || stats.balanceDetails.length === 0 ? (
              <div className="p-5">
                <CardEmptyState
                  icon="bx-wallet"
                  message={t('admin.noWalletsFound', { defaultValue: 'No wallets with balance found' })}
                />
              </div>
            ) : (
              <>
                <div className="sm:hidden p-4 space-y-3">
                  {stats.balanceDetails.map((wallet) => {
                    const coin = wallet.systemWallet?.coinNetwork?.coin
                    const coinSymbol = coin?.symbol
                    const network = wallet.systemWallet?.coinNetwork?.network
                    const networkSymbol = network?.symbol
                    const networkName = network?.name
                    const address = wallet.systemWallet?.address || ''
                    const decimals = wallet.decimals || wallet.systemWallet?.coinNetwork?.decimals || 18
                    const decimalBalance = AmountNormalizer.fromRawSimple(wallet.totalBalanceRaw || '0', decimals)
                    const rate = stats.fiat?.rates?.[coinSymbol] || 0
                    const usdValue = parseFloat(decimalBalance) * parseFloat(rate)

                    return (
                      <div key={wallet.id} className="rounded-lg border border-surface-200 p-3 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CoinImg coin={coin} symbol={coinSymbol} networkSymbol={networkSymbol} size={28} />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{coinSymbol || 'N/A'}</div>
                              <div className="text-xs text-surface-500 truncate">
                                {(networkSymbol || '').toUpperCase() || 'N/A'} · {networkName || 'N/A'}
                              </div>
                            </div>
                          </div>
                          {wallet.systemWallet?.status === 'active' ? (
                            <Badge color="success" label>
                              {t('admin.active', { defaultValue: 'Active' })}
                            </Badge>
                          ) : (
                            <Badge color="secondary">{wallet.systemWallet?.status}</Badge>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-surface-500">{t('admin.totalBalance', { defaultValue: 'Total Balance' })}</div>
                            <div className="font-medium">{formatCoinAmount(decimalBalance)} {coinSymbol}</div>
                          </div>
                          <div>
                            <div className="text-xs text-surface-500">{t('admin.valueUSD', { defaultValue: 'Value (USD)' })}</div>
                            <div className="font-medium">{formatUsd(usdValue)}</div>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-surface-500 space-y-0.5">
                          <div>{t('admin.confirmedBalance', { defaultValue: 'Confirmed' })}: <span className="text-surface-700">{formatCoinAmount(AmountNormalizer.fromRawSimple(wallet.confirmedBalanceRaw || '0', decimals))} {coinSymbol}</span></div>
                          <div>{t('admin.unconfirmedBalance', { defaultValue: 'Unconfirmed' })}: <span className="text-surface-700">{formatCoinAmount(AmountNormalizer.fromRawSimple(wallet.unconfirmedBalanceRaw || '0', decimals))} {coinSymbol}</span></div>
                          <div>{t('admin.lockedBalance', { defaultValue: 'Locked' })}: <span className="text-surface-700">{formatCoinAmount(AmountNormalizer.fromRawSimple(wallet.lockedBalanceRaw || '0', decimals))} {coinSymbol}</span></div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-surface-500">{t('admin.address', { defaultValue: 'Address' })}:</span>
                          <span className="font-mono truncate">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}</span>
                          {address ? (
                            <Button
                              onClick={() => copyAddress(address, wallet.id)}
                              title={t('actions.copy', { defaultValue: 'Copy' })}
                              size="icon-sm"
                              variant="text-secondary"
                            >
                              {copiedId === wallet.id ? <i className="bx bx-check text-success"></i> : <i className="bx bx-copy"></i>}
                            </Button>
                          ) : null}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="capitalize text-xs text-surface-500">{wallet.systemWallet?.purpose || 'N/A'}</span>
                            {wallet.systemWallet?.walletType === 'hot' ? (
                              <Badge color="warning" label>
                                <i className="bx bxs-hot mr-1"></i>
                                {t('admin.hot', { defaultValue: 'Hot' })}
                              </Badge>
                            ) : (
                              <Badge color="info" label>
                                <i className="bx bx-shield mr-1"></i>
                                {t('admin.cold', { defaultValue: 'Cold' })}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="text-secondary"
                            size="icon-sm"
                            href={`/admin/system-ledger?walletId=${wallet.systemWallet?.id}`}
                            title={t('actions.view', { defaultValue: 'View' })}
                          >
                            <i className="bx bx-receipt text-[1rem]"></i>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="hidden sm:block">
                  <Table className="min-w-max">
                    <thead>
                      <tr>
                        <th>{t('invoices.chain') || 'Chain'}</th>
                        <th className="min-w-[180px]">{t('balance.col.coin')}</th>
                        <th>{t('admin.address', { defaultValue: 'Address' })}</th>
                        <th>{t('admin.purpose', { defaultValue: 'Purpose' })}</th>
                        <th>{t('admin.type', { defaultValue: 'Type' })}</th>
                        <th>{t('invoices.statusCol')}</th>
                        <th className="text-right min-w-[200px] whitespace-nowrap">
                          {t('admin.totalBalance', { defaultValue: 'Total Balance' })}
                        </th>
                        <th className="text-right min-w-[140px] whitespace-nowrap">
                          {t('admin.valueUSD', { defaultValue: 'Value (USD)' })}
                        </th>
                        <th className="text-right min-w-[200px] whitespace-nowrap">
                          {t('admin.confirmedBalance', { defaultValue: 'Confirmed' })}
                        </th>
                        <th className="text-right min-w-[200px] whitespace-nowrap">
                          {t('admin.unconfirmedBalance', { defaultValue: 'Unconfirmed' })}
                        </th>
                        <th className="text-right min-w-[200px] whitespace-nowrap">
                          {t('admin.lockedBalance', { defaultValue: 'Locked' })}
                        </th>
                        <th className="text-center min-w-[120px]">{t('invoices.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.balanceDetails.map((wallet) => {
                        const coin = wallet.systemWallet?.coinNetwork?.coin
                        const coinSymbol = coin?.symbol
                        const network = wallet.systemWallet?.coinNetwork?.network
                        const networkSymbol = network?.symbol
                        const networkName = network?.name
                        const address = wallet.systemWallet?.address || ''

                        // Get decimals and convert raw balance to decimal
                        const decimals = wallet.decimals || wallet.systemWallet?.coinNetwork?.decimals || 18
                        const decimalBalance = AmountNormalizer.fromRawSimple(wallet.totalBalanceRaw || '0', decimals)

                        const rate = stats.fiat?.rates?.[coinSymbol] || 0
                        const usdValue = parseFloat(decimalBalance) * parseFloat(rate)

                        return (
                          <tr key={wallet.id}>
                            <td>
                              <span className="text-surface-500">{(networkSymbol || '').toUpperCase() || 'N/A'}</span>
                            </td>
                            <td>
                              <div className="flex items-center">
                                <CoinImg
                                  coin={coin}
                                  symbol={coinSymbol}
                                  networkSymbol={networkSymbol}
                                  size={32}
                                  className="mr-3"
                                />
                                <div>
                                  <div>{coinSymbol || 'N/A'}</div>
                                  <small className="text-surface-500">{networkName || 'N/A'}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[400px]" title={address}>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}</span>
                                {address ? (
                                  <Button
                                    onClick={() => copyAddress(address, wallet.id)}
                                    title={t('actions.copy', { defaultValue: 'Copy' })}
                                    size="icon-sm"
                                    variant="text-secondary"
                                  >
                                    {copiedId === wallet.id ? (
                                      <i className="bx bx-check text-success"></i>
                                    ) : (
                                      <i className="bx bx-copy"></i>
                                    )}
                                  </Button>
                                ) : null}
                                {address && wallet.systemWallet?.coinNetwork?.network?.explorerUrl ? (
                                  <Button
                                    variant="text-secondary"
                                    size="icon-sm"
                                    href={`${wallet.systemWallet.coinNetwork.network.explorerUrl}/address/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={t('invoices.viewOnExplorer')}
                                  >
                                    <i className="bx bx-link-external"></i>
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <span className="capitalize">{wallet.systemWallet?.purpose || 'N/A'}</span>
                            </td>
                            <td>
                              {wallet.systemWallet?.walletType === 'hot' ? (
                                <Badge color="warning" label>
                                  <i className="bx bxs-hot mr-1"></i>
                                  {t('admin.hot', { defaultValue: 'Hot' })}
                                </Badge>
                              ) : (
                                <Badge color="info" label>
                                  <i className="bx bx-shield mr-1"></i>
                                  {t('admin.cold', { defaultValue: 'Cold' })}
                                </Badge>
                              )}
                            </td>
                            <td>
                              {wallet.systemWallet?.status === 'active' ? (
                                <Badge color="success" label>
                                  {t('admin.active', { defaultValue: 'Active' })}
                                </Badge>
                              ) : (
                                <Badge color="secondary">{wallet.systemWallet?.status}</Badge>
                              )}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span
                                className="font-medium"
                                title={`Raw: ${wallet.totalBalanceRaw || '0'}\nDecimals: ${decimals}`}
                              >
                                {formatCoinAmount(decimalBalance)}
                              </span>
                              <small className="text-surface-500 ml-1">{coinSymbol}</small>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span className="font-medium">{formatUsd(usdValue)}</span>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {(() => {
                                const val = AmountNormalizer.fromRawSimple(wallet.confirmedBalanceRaw || '0', decimals)
                                return (
                                  <>
                                    <span
                                      className="font-medium"
                                      title={`Raw: ${wallet.confirmedBalanceRaw || '0'}\nDecimals: ${decimals}`}
                                    >
                                      {formatCoinAmount(val)}
                                    </span>
                                    <small className="text-surface-500 ml-1">{coinSymbol}</small>
                                  </>
                                )
                              })()}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {(() => {
                                const val = AmountNormalizer.fromRawSimple(wallet.unconfirmedBalanceRaw || '0', decimals)
                                return (
                                  <>
                                    <span
                                      className="font-medium"
                                      title={`Raw: ${wallet.unconfirmedBalanceRaw || '0'}\nDecimals: ${decimals}`}
                                    >
                                      {formatCoinAmount(val)}
                                    </span>
                                    <small className="text-surface-500 ml-1">{coinSymbol}</small>
                                  </>
                                )
                              })()}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {(() => {
                                const val = AmountNormalizer.fromRawSimple(wallet.lockedBalanceRaw || '0', decimals)
                                return (
                                  <>
                                    <span
                                      className="font-medium"
                                      title={`Raw: ${wallet.lockedBalanceRaw || '0'}\nDecimals: ${decimals}`}
                                    >
                                      {formatCoinAmount(val)}
                                    </span>
                                    <small className="text-surface-500 ml-1">{coinSymbol}</small>
                                  </>
                                )
                              })()}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="text-secondary"
                                size="icon-sm"
                                className="mr-1"
                                href={`/admin/system-ledger?walletId=${wallet.systemWallet?.id}`}
                                title={t('actions.view', { defaultValue: 'View' })}
                              >
                                <i className="bx bx-receipt text-[1rem]"></i>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
