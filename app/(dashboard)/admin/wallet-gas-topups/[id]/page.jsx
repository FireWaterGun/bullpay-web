'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getGasTopupById } from '@/lib/api/admin'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatCoinAmount } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import GasTopupDetailsCard from '@/components/admin/GasTopupDetailsCard'
import GasTopupTransactionCard from '@/components/admin/GasTopupTransactionCard'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

export default function GasTopupDetail() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [topup, setTopup] = useState(null)

  useEffect(() => {
    loadTopup()
  }, [id])

  async function loadTopup() {
    try {
      setLoading(true)
      const data = await getGasTopupById(token, Number(id))
      setTopup(data)
    } catch (error) {
      logger.error('Failed to load gas topup:', error)
      toast.error(t('admin.gasTopup.loadDetailError', { defaultValue: 'Failed to load gas topup details' }))
    } finally {
      setLoading(false)
    }
  }

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

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'pending') return 'badge bg-amber-50 text-amber-700'
    if (v === 'processing') return 'badge bg-cyan-50 text-cyan-700'
    if (v === 'completed') return 'badge bg-green-50 text-green-700'
    if (v === 'failed') return 'badge bg-red-50 text-red-700'
    if (v === 'skipped') return 'badge bg-surface-100 text-surface-600'
    return 'badge bg-surface-100 text-surface-600'
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!topup) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">{t('admin.gasTopup.notFound', { defaultValue: 'Gas topup not found' })}</p>
          <button className="btn btn-primary" onClick={() => router.back()}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  let metadata = {}
  try {
    metadata = typeof topup.metadata === 'string' ? JSON.parse(topup.metadata) : topup.metadata || {}
  } catch (e) { /* ignore */ }

  const coinSymbol = (topup.coinNetwork?.coin?.symbol || topup.coinSymbol || metadata.tokenSymbol || '').toUpperCase()
  const networkSymbol = (topup.coinNetwork?.network?.symbol || topup.networkSymbol || '').toUpperCase()
  const networkName = topup.coinNetwork?.network?.name || topup.networkName || metadata.networkName || ''
  const explorerUrl = topup.coinNetwork?.network?.explorerUrl || topup.explorerUrl || null
  const decimals = topup.coinNetwork?.decimals || topup.decimals || 18

  const failureReason = topup.failureReason || metadata.failureReason || topup.errorMessage || null

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <button
            onClick={() => router.back()}
            className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 mb-3"
          >
            <i className="bx bx-arrow-back mr-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          <div className="card mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {coinSymbol && (
                    <CoinImg
                      symbol={coinSymbol}
                      networkSymbol={networkSymbol}
                      size={48}
                    />
                  )}
                  <div>
                    <h4 className="mb-1">
                      {t('admin.gasTopup.detailTitle', { id: topup.id, defaultValue: 'Gas Topup #{{id}}' })}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={statusBadgeClass(topup.status)}>
                        {String(topup.status || '').toUpperCase()}
                      </span>
                      {coinSymbol && (
                        <span className="badge bg-surface-100 text-surface-600">
                          {coinSymbol}
                        </span>
                      )}
                      {networkName && (
                        <span className="badge bg-surface-100 text-surface-600">
                          {networkName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="fs-4 font-bold">
                    {formatAmount(topup.topupGasRaw || topup.amountRaw || topup.amount, decimals)}{' '}
                    <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>ETH</span>
                  </div>
                  <small className="text-muted">{t('admin.gasTopup.topupGas', { defaultValue: 'Topup Gas' })}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-6">
            <div className="md:col-span-6">
              <GasTopupDetailsCard
                topup={topup}
                coinSymbol={coinSymbol}
                networkSymbol={networkSymbol}
                networkName={networkName}
                decimals={decimals}
                formatAmount={formatAmount}
                statusBadgeClass={statusBadgeClass}
                t={t}
              />
            </div>

            <div className="md:col-span-6">
              <GasTopupTransactionCard
                topup={topup}
                explorerUrl={explorerUrl}
                onCopy={handleCopy}
                t={t}
              />
            </div>
          </div>

          {metadata && Object.keys(metadata).length > 0 && (
            <div className="card mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0">
                  <i className="bx bx-info-circle mr-2"></i>
                  {t('admin.gasTopup.metadata', { defaultValue: 'Metadata' })}
                </h5>
              </div>
              <div className="p-5">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {metadata.tokenSymbol && (
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.gasTopup.tokenSymbol', { defaultValue: 'Token Symbol' })}</td>
                        <td>{metadata.tokenSymbol}</td>
                      </tr>
                    )}
                    {metadata.tokenContractAddress && (
                      <tr>
                        <td className="text-muted">{t('admin.gasTopup.tokenContract', { defaultValue: 'Token Contract' })}</td>
                        <td>
                          <code className="break-words" style={{ fontSize: '0.75rem' }}>{metadata.tokenContractAddress}</code>
                          {explorerUrl && (
                            <a
                              href={`${explorerUrl}/address/${metadata.tokenContractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full ml-1"
                              title={t('admin.gasTopup.viewOnExplorer', { defaultValue: 'View on explorer' })}
                            >
                              <i className="bx bx-link-external"></i>
                            </a>
                          )}
                        </td>
                      </tr>
                    )}
                    {metadata.networkName && (
                      <tr>
                        <td className="text-muted">{t('admin.gasTopup.networkName', { defaultValue: 'Network Name' })}</td>
                        <td>{metadata.networkName}</td>
                      </tr>
                    )}
                    {metadata.createdByTask && (
                      <tr>
                        <td className="text-muted">{t('admin.gasTopup.createdByTask', { defaultValue: 'Created By' })}</td>
                        <td><code>{metadata.createdByTask}</code></td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {failureReason && (
            <div className="card mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0 text-danger">
                  <i className="bx bx-error mr-2"></i>
                  {t('admin.gasTopup.failureReason', { defaultValue: 'Failure Reason' })}
                </h5>
              </div>
              <div className="p-5">
                <pre className="mb-0 text-danger" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                  {failureReason}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
