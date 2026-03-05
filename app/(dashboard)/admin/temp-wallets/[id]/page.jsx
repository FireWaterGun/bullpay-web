'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getTempWallet } from '@/lib/api/admin'
import { useDateFormat } from '@/hooks/useDateFormat'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'active' || v === 'pooled') return 'badge bg-green-50 text-green-700'
  if (v === 'assigned') return 'badge bg-cyan-50 text-cyan-700'
  if (v === 'used' || v === 'sweeped') return 'badge bg-amber-50 text-amber-700'
  if (v === 'expired' || v === 'disabled') return 'badge bg-red-50 text-red-700'
  return 'badge bg-surface-100 text-surface-600'
}

export default function TempWalletDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)

  useEffect(() => { loadWallet() }, [id])

  async function loadWallet() {
    try {
      setLoading(true)
      const data = await getTempWallet(token, id)
      setWallet(data)
    } catch (error) {
      logger.error('Failed to load temp wallet:', error)
      toast.error(t('admin.tempWallet.loadDetailError', { defaultValue: 'Failed to load temp wallet' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!wallet) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">Temp wallet not found</p>
          <button className="btn btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none" onClick={() => router.back()}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Link href="/admin/temp-wallets" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 mb-3">
            <i className="bx bx-arrow-back mr-2"></i>Back to Temp Wallets
          </Link>

          {/* Header Card */}
          <div className="card mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet mr-2"></i>
                    Temp Wallet #{wallet.id}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={statusBadgeClass(wallet.status)}>
                      {String(wallet.status || '').toUpperCase()}
                    </span>
                    {wallet.isExpired && (
                      <span className="badge bg-red-50 text-red-700">EXPIRED</span>
                    )}
                    {wallet.coinSymbol && (
                      <span className="badge bg-primary-50 text-primary-600 inline-flex items-center gap-1">
                        <CoinImg symbol={wallet.coinSymbol} networkSymbol={wallet.networkSymbol} size={16} />
                        {wallet.coinSymbol} · {wallet.networkSymbol}
                      </span>
                    )}
                    {wallet.invoiceId && (
                      <span className="badge bg-surface-100 text-surface-600">Invoice #{wallet.invoiceId}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/temp-wallet-histories?tempWalletId=${wallet.id}`}
                    className="btn btn border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white"
                  >
                    <i className="bx bx-history mr-1"></i>
                    View Histories
                  </Link>
                  <RefreshButton onClick={loadWallet} loading={loading} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-6">
            {/* Wallet Info */}
            <div className="md:col-span-6">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-detail mr-2"></i>Wallet Details</h5>
                </div>
                <div className="p-5">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{wallet.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={statusBadgeClass(wallet.status)}>
                            {String(wallet.status || '').toUpperCase()}
                          </span>
                          {wallet.isExpired && (
                            <span className="badge bg-red-50 text-red-700 ml-1">EXPIRED</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice ID</td>
                        <td>
                          {wallet.invoiceId ? (
                            <Link
                              href={`/admin/invoices/${wallet.invoiceId}`}
                              className="font-medium text-primary"
                            >
                              {wallet.invoiceId}
                            </Link>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="font-medium">{wallet.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <CoinImg symbol={wallet.coinSymbol} networkSymbol={wallet.networkSymbol} size={28} />
                            <div>
                              <span className="font-semibold">{wallet.coinSymbol || '-'}</span>
                              <span className="text-muted ml-1" style={{ fontSize: '0.8rem' }}>on {wallet.networkName || wallet.networkSymbol || '-'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Decimals</td>
                        <td className="font-medium">{wallet.decimals ?? '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.address', { defaultValue: 'Address' })}</td>
                        <td>
                          {wallet.address ? (
                            <div className="flex items-center">
                              <code className="text-body mr-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {wallet.address}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
                                onClick={() => handleCopy(wallet.address)}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                              {wallet.explorerUrl && (
                                <a
                                  href={`${wallet.explorerUrl}/address/${wallet.address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn bg-transparent text-primary-600 hover:bg-primary-50 shadow-none rounded-full shrink-0"
                                  title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                                >
                                  <i className="bx bx-link-external"></i>
                                </a>
                              )}
                            </div>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Reuse Count</td>
                        <td className="font-medium">{wallet.reuseCount ?? 0}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Received</td>
                        <td>
                          <span className="font-medium">{wallet.totalReceivedAmount || '0'}</span>
                          <span className="text-muted ml-1" style={{ fontSize: '0.75rem' }}>{wallet.coinSymbol}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Swept</td>
                        <td>
                          <span className="font-medium">{wallet.totalSweptAmount || '0'}</span>
                          <span className="text-muted ml-1" style={{ fontSize: '0.75rem' }}>{wallet.coinSymbol}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-6">
              {/* Flags */}
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-flag mr-2"></i>Flags</h5>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {wallet.isReusable != null && (
                      wallet.isReusable
                        ? <span className="badge bg-green-50 text-green-700">Reusable</span>
                        : <span className="badge bg-surface-100 text-surface-600">Not Reusable</span>
                    )}
                    {wallet.isAssigned && <span className="badge bg-cyan-50 text-cyan-700">Assigned</span>}
                    {wallet.isAvailable && <span className="badge bg-green-50 text-green-700">Available</span>}
                    {wallet.isExpired && <span className="badge bg-red-50 text-red-700">{t('status.expired', { defaultValue: 'Expired' })}</span>}
                    {wallet.hasBeenUsed && <span className="badge bg-amber-50 text-amber-700">Has Been Used</span>}
                    {wallet.needsSweeping && <span className="badge bg-primary-50 text-primary-600">Needs Sweeping</span>}
                    {wallet.timeToExpiry != null && (
                      <span className="badge bg-amber-50 text-amber-700">
                        Expires in {Math.floor(wallet.timeToExpiry / 60000)}m
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-time-five mr-2"></i>{t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}</h5>
                </div>
                <div className="p-5">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(wallet.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                        <td>{fmtDate(wallet.updatedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Expires</td>
                        <td>{fmtDate(wallet.expiresAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">First Used</td>
                        <td>{fmtDate(wallet.firstUsedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Assigned</td>
                        <td>{fmtDate(wallet.lastAssignedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Released</td>
                        <td>{fmtDate(wallet.lastReleasedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Checked</td>
                        <td>{fmtDate(wallet.lastCheckedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Sweep</td>
                        <td>{fmtDate(wallet.lastSweepAt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sweep Info */}
              {(wallet.lastSweepTxHash || wallet.lastSweepAmountRaw || wallet.lastTxHash || wallet.lastBlockNumber) && (
                <div className="card mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0"><i className="bx bx-transfer mr-2"></i>Sweep Info</h5>
                  </div>
                  <div className="p-5">
                    <table className="w-full mb-0">
                      <tbody>
                        {wallet.lastSweepTxHash && (
                          <tr>
                            <td className="text-muted" style={{ width: '40%' }}>Sweep Tx Hash</td>
                            <td>
                              <div className="flex items-center">
                                <code className="text-body mr-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                  {wallet.lastSweepTxHash}
                                </code>
                                <button
                                  className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
                                  onClick={() => handleCopy(wallet.lastSweepTxHash)}
                                  title={t('actions.copy', { defaultValue: 'Copy' })}
                                >
                                  <i className="bx bx-copy"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {(wallet.lastSweepAmount || wallet.lastSweepAmountRaw) && (
                          <tr>
                            <td className="text-muted">Sweep Amount</td>
                            <td>
                              <span className="font-medium">{wallet.lastSweepAmount || wallet.lastSweepAmountRaw}</span>
                              <span className="text-muted ml-1" style={{ fontSize: '0.75rem' }}>{wallet.coinSymbol}</span>
                            </td>
                          </tr>
                        )}
                        {wallet.lastTxHash && (
                          <tr>
                            <td className="text-muted">Last Tx Hash</td>
                            <td>
                              <div className="flex items-center">
                                <code className="text-body mr-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                  {wallet.lastTxHash}
                                </code>
                                <button
                                  className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
                                  onClick={() => handleCopy(wallet.lastTxHash)}
                                  title={t('actions.copy', { defaultValue: 'Copy' })}
                                >
                                  <i className="bx bx-copy"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {wallet.lastBlockNumber && (
                          <tr>
                            <td className="text-muted">Last Block Number</td>
                            <td className="font-medium">{wallet.lastBlockNumber}</td>
                          </tr>
                        )}
                        {(wallet.lastLeftoverTokenAmount || wallet.lastLeftoverTokenRaw) && (
                          <tr>
                            <td className="text-muted">Leftover Token</td>
                            <td>
                              <span className="font-medium">{wallet.lastLeftoverTokenAmount || wallet.lastLeftoverTokenRaw}</span>
                              <span className="text-muted ml-1" style={{ fontSize: '0.75rem' }}>{wallet.coinSymbol}</span>
                            </td>
                          </tr>
                        )}
                        {(wallet.lastLeftoverNativeAmount || wallet.lastLeftoverNativeRaw) && (
                          <tr>
                            <td className="text-muted">Leftover Native</td>
                            <td>
                              <span className="font-medium">{wallet.lastLeftoverNativeAmount || wallet.lastLeftoverNativeRaw}</span>
                            </td>
                          </tr>
                        )}
                        {wallet.lastReason && (
                          <tr>
                            <td className="text-muted">Last Reason</td>
                            <td>{wallet.lastReason}</td>
                          </tr>
                        )}
                        {wallet.lastSource && (
                          <tr>
                            <td className="text-muted">Last Source</td>
                            <td>{wallet.lastSource}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {wallet.metadata && Object.keys(wallet.metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0"><i className="bx bx-code-alt mr-2"></i>{t('admin.detail.metadata', { defaultValue: 'Metadata' })}</h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem', maxHeight: 300, overflow: 'auto' }}>
                      {JSON.stringify(wallet.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
