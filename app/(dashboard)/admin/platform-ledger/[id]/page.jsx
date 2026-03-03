'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getPlatformLedgerEntry } from '@/lib/api/admin'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

export default function PlatformLedgerDetail() {
  const { fmtDateTime } = useDateFormat()
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)

  useEffect(() => {
    loadEntry()
  }, [id])

  async function loadEntry() {
    try {
      setLoading(true)
      const data = await getPlatformLedgerEntry(token, parseInt(id))
      setEntry(data)
    } catch (error) {
      logger.error('Failed to load platform ledger entry:', error)
      toast.error(t('admin.platformLedger.loadError', { defaultValue: 'Failed to load platform ledger entry' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(val) {
    if (!val && val !== 0) return '0'
    let str = String(val)
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '')
    }
    return str || '0'
  }


  function stateBadge(state) {
    if (state === 'settled') return <span className="badge bg-label-success">Settled</span>
    if (state === 'committed') return <span className="badge bg-label-info">Committed</span>
    if (state === 'reversed') return <span className="badge bg-label-secondary">Reversed</span>
    return <span className="text-muted">{state || 'N/A'}</span>
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    else toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
  }

  const entryCodeLabels = {
    'WF': 'Withdrawal Fee',
    'FR': 'Fee Refund',
    'SG': 'Sweep Gas Topup',
    'SC': 'Sweep Gas Cost',
    'WG': 'Withdrawal Gas',
    'XI': 'Internal Transfer In',
    'XO': 'Internal Transfer Out',
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!entry) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">{t('admin.platformLedger.notFound', { defaultValue: 'Platform ledger entry not found' })}</p>
          <button className="btn btn-primary" onClick={() => router.back()}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  const isCredit = entry.entryType === 'credit'
  const isReversed = entry.state === 'reversed'

  // Parse metadata
  let metadata = {}
  try {
    metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
  } catch (e) { /* ignore */ }

  const explorerUrl = entry.explorerUrl || null

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="btn btn-outline-secondary mb-3"
          >
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          {/* Header */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  {entry.coinSymbol && (
                    <CoinImg
                      symbol={entry.coinSymbol}
                      networkSymbol={entry.networkSymbol}
                      size={48}
                    />
                  )}
                  <div>
                    <h4 className="mb-1">
                      Platform Ledger Entry #{entry.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`badge ${entry.accountType === 'revenue' ? 'bg-label-success' : 'bg-label-warning'}`}>
                        {entry.accountType === 'revenue' ? 'Revenue' : 'Expense'}
                      </span>
                      <span className={`badge ${entry.state === 'reversed' ? 'bg-label-secondary' : (isCredit ? 'bg-label-success' : 'bg-label-danger')}`}>
                        <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} me-1`}></i>
                        {isCredit ? 'Credit' : 'Debit'}
                      </span>
                      {entry.entryCode && (
                        <span className="badge bg-label-secondary">
                          {entryCodeLabels[entry.entryCode] || entry.entryCode}
                        </span>
                      )}
                      {stateBadge(entry.state)}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className={`fs-4 fw-bold ${isReversed ? '' : (isCredit ? 'text-success' : 'text-danger')}`}>
                    {isReversed ? '' : (isCredit ? '+' : '-')}{formatAmount(entry.amount)} <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>{entry.coinSymbol}</span>
                  </div>
                  <div className="text-muted">
                    {formatUsd(entry.amountUsd)}
                  </div>
                  {entry.networkName && (
                    <small className="text-muted">{entry.networkName}</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Entry Details */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-detail me-2"></i>
                    Details
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="fw-medium">{entry.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Account Type</td>
                        <td>
                          <span className={`badge ${entry.accountType === 'revenue' ? 'bg-label-success' : 'bg-label-warning'}`}>
                            {entry.accountType === 'revenue' ? 'Revenue' : 'Expense'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="me-3" />
                            <span className="fw-medium">{entry.coinSymbol || '-'}</span>
                            {entry.networkName && <span className="text-muted ms-1">({entry.networkName})</span>}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Entry Code</td>
                        <td>
                          <span className="fw-medium">{entry.entryCode || '-'}</span>
                          {entry.entryCode && entryCodeLabels[entry.entryCode] && (
                            <span className="text-muted ms-1">- {entryCodeLabels[entry.entryCode]}</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Entry Type</td>
                        <td>
                          <span className={`badge ${entry.state === 'reversed' ? 'bg-label-secondary' : (isCredit ? 'bg-label-success' : 'bg-label-danger')}`}>
                            {isCredit ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.state', { defaultValue: 'State' })}</td>
                        <td>{stateBadge(entry.state)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className={`fw-medium ${isReversed ? '' : (isCredit ? 'text-success' : 'text-danger')}`}>
                            {isReversed ? '' : (isCredit ? '+' : '-')}{formatAmount(entry.amount)} {entry.coinSymbol}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD Value</td>
                        <td className="fw-medium">{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDateTime(entry.createdAt)}</td>
                      </tr>
                      {entry.updatedAt && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                          <td>{fmtDateTime(entry.updatedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Transaction & Metadata */}
            <div className="col-md-6">
              {entry.txHash && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bx bx-link me-2"></i>
                      Transaction
                    </h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '30%' }}>{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <code className="me-2" style={{ wordBreak: 'break-all' }}>{entry.txHash}</code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary"
                                onClick={() => handleCopy(entry.txHash)}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                              {explorerUrl && (
                                <a
                                  href={`${explorerUrl}/tx/${entry.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn-text-secondary"
                                  title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                                >
                                  <i className="bx bx-link-external"></i>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {metadata && Object.keys(metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bx bx-code-alt me-2"></i>
                      Metadata
                    </h5>
                  </div>
                  <div className="card-body">
                    <pre className="bg-lighter p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto' }}>
                      {JSON.stringify(metadata, null, 2)}
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
