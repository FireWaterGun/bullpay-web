'use client'

import { useParams } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getGasTopupById } from '@/lib/api/admin'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatCoinAmount } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import GasTopupDetailsCard from '@/components/admin/GasTopupDetailsCard'
import GasTopupTransactionCard from '@/components/admin/GasTopupTransactionCard'
import PageSpinner from '@/components/PageSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function GasTopupDetail() {
  const { t } = useAdminTranslation()
  const toast = useToast()
  const { id } = useParams()

  const { data: topup, isLoading: loading } = useApi(
    id ? `gas-topup-${id}` : null,
    (token) => getGasTopupById(token, Number(id)),
    { onError: () => toast.error(t('admin.gasTopup.loadDetailError', { defaultValue: 'Failed to load gas topup details' })) }
  )

  function formatAmount(amountRaw, decimals = 18) {
    if (!amountRaw) return '0'
    try {
      const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
      return formatCoinAmount(value)
    } catch (e) {
      return amountRaw.toString()
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!topup) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">
            {t('admin.gasTopup.notFound', { defaultValue: 'Gas topup not found' })}
          </p>
          <Button href="/admin/wallet-gas-topups">{t('actions.back', { defaultValue: 'Back' })}</Button>
        </div>
      </div>
    )
  }

  let metadata = {}
  try {
    metadata = typeof topup.metadata === 'string' ? JSON.parse(topup.metadata) : topup.metadata || {}
  } catch (e) {
    /* ignore */
  }

  const coinSymbol = (topup.coinNetwork?.coin?.symbol || topup.coinSymbol || metadata.tokenSymbol || '').toUpperCase()
  const networkSymbol = (topup.coinNetwork?.network?.symbol || topup.networkSymbol || '').toUpperCase()
  const networkName = topup.coinNetwork?.network?.name || topup.networkName || metadata.networkName || ''
  const explorerUrl = topup.coinNetwork?.network?.explorerUrl || topup.explorerUrl || null
  const decimals = topup.coinNetwork?.decimals || topup.decimals || 18

  const failureReason = topup.failureReason || metadata.failureReason || topup.errorMessage || null

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/wallet-gas-topups">
              <i className="bx bx-arrow-back"></i>
              {t('admin.gasTopup.backToList', { defaultValue: 'Back to Gas Topups' })}
            </Button>
          </div>

          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {coinSymbol ? <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={48} /> : null}
                  <div>
                    <h4 className="mb-1">
                      {t('admin.gasTopup.detailTitle', { id: topup.id, defaultValue: 'Gas Topup #{{id}}' })}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={getStatusBadgeClass(topup.status, 'gasTopup')}>
                        {String(topup.status || '').toUpperCase()}
                      </span>
                      {coinSymbol ? <Badge color="secondary">{coinSymbol}</Badge> : null}
                      {networkName ? <Badge color="secondary">{networkName}</Badge> : null}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatAmount(topup.topupGasRaw || topup.amountRaw || topup.amount, decimals)}{' '}
                    <span className="text-[0.75em] font-normal">ETH</span>
                  </div>
                  <small className="text-surface-500">
                    {t('admin.gasTopup.topupGas', { defaultValue: 'Topup Gas' })}
                  </small>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-12 md:col-span-6">
              <GasTopupDetailsCard
                topup={topup}
                coinSymbol={coinSymbol}
                networkSymbol={networkSymbol}
                networkName={networkName}
                decimals={decimals}
                formatAmount={formatAmount}
                statusBadgeClass={(s) => getStatusBadgeClass(s, 'gasTopup')}
                t={t}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <GasTopupTransactionCard topup={topup} explorerUrl={explorerUrl} onCopy={handleCopy} t={t} />
            </div>
          </div>

          {metadata && Object.keys(metadata).length > 0 && (
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0">
                  <i className="bx bx-info-circle mr-2"></i>
                  {t('admin.gasTopup.metadata', { defaultValue: 'Metadata' })}
                </h5>
              </div>
              <div className="p-5">
                <Table>
                  <tbody>
                    {metadata.tokenSymbol && (
                      <tr>
                        <td className="text-surface-500 w-2/5">
                          {t('admin.gasTopup.tokenSymbol', { defaultValue: 'Token Symbol' })}
                        </td>
                        <td>{metadata.tokenSymbol}</td>
                      </tr>
                    )}
                    {metadata.tokenContractAddress && (
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.gasTopup.tokenContract', { defaultValue: 'Token Contract' })}
                        </td>
                        <td>
                          <code className="break-words text-xs">{metadata.tokenContractAddress}</code>
                          {explorerUrl && (
                            <Button
                              variant="text-secondary"
                              size="icon-sm"
                              className="ml-1"
                              href={`${explorerUrl}/address/${metadata.tokenContractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t('admin.gasTopup.viewOnExplorer', { defaultValue: 'View on explorer' })}
                            >
                              <i className="bx bx-link-external"></i>
                            </Button>
                          )}
                        </td>
                      </tr>
                    )}
                    {metadata.networkName && (
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.gasTopup.networkName', { defaultValue: 'Network Name' })}
                        </td>
                        <td>{metadata.networkName}</td>
                      </tr>
                    )}
                    {metadata.createdByTask && (
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.gasTopup.createdByTask', { defaultValue: 'Created By' })}
                        </td>
                        <td>
                          <code>{metadata.createdByTask}</code>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {failureReason && (
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0 text-danger">
                  <i className="bx bx-error mr-2"></i>
                  {t('admin.gasTopup.failureReason', { defaultValue: 'Failure Reason' })}
                </h5>
              </div>
              <div className="p-5">
                <pre className="mb-0 text-danger whitespace-pre-wrap break-all text-[0.85rem]">{failureReason}</pre>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
