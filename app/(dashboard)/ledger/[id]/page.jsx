'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getMyLedgerEntry } from '@/lib/api/userLedger'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

const ENTRY_CODE_LABELS = {
  'DP': 'Deposit',
  'WA': 'Withdrawal Amount',
  'WF': 'Withdrawal Fee',
  'WR': 'Withdrawal Reversal',
  'FR': 'Fee Revenue',
  'XI': 'Internal Transfer In',
  'XO': 'Internal Transfer Out',
}

function getEntryCodeLabel(code, t) {
  return t(`userLedger.code.${code}`, { defaultValue: ENTRY_CODE_LABELS[code] || code })
}

export default function MyLedgerDetail() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { id } = useParams()
  const { fmtDateTime } = useDateFormat()
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)

  useEffect(() => {
    loadEntry()
  }, [id])

  async function loadEntry() {
    try {
      setLoading(true)
      const data = await getMyLedgerEntry(token, id)
      setEntry(data)
    } catch (error) {
      logger.error('Failed to load ledger entry:', error)
      toast.error(t('userLedger.loadError', { defaultValue: 'Failed to load ledger entry' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(val) {
    if (!val && val !== 0) return '0'
    let str = String(val)
    if (str.includes('.')) str = str.replace(/0+$/, '').replace(/\.$/, '')
    return str || '0'
  }

  function stateText(state) {
    if (state === 'settled') return <span className="badge bg-label-success">{t('userLedger.settled', { defaultValue: 'Settled' })}</span>
    if (state === 'committed') return <span className="badge bg-label-info">{t('userLedger.committed', { defaultValue: 'Committed' })}</span>
    if (state === 'reversed') return <span className="badge bg-label-secondary">{t('userLedger.reversed', { defaultValue: 'Reversed' })}</span>
    return <span className="text-muted">{state || 'N/A'}</span>
  }

  async function copyToClipboard(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    else toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!entry) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">{t('userLedger.notFound', { defaultValue: 'Ledger entry not found' })}</p>
          <Link href="/ledger" className="btn btn-primary">
            {t('actions.back', { defaultValue: 'Back' })}
          </Link>
        </div>
      </div>
    )
  }

  const isCredit = entry.entryType === 'credit'
  const isReversed = entry.state === 'reversed'

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back Button */}
          <Link href="/ledger" className="btn btn-outline-secondary mb-3">
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </Link>

          {/* Header */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  {entry.coinSymbol && (
                    <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={48} />
                  )}
                  <div>
                    <h4 className="mb-1">
                      {t('userLedger.entryDetail', { defaultValue: 'Ledger Entry' })} #{entry.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {entry.entryCode && (
                        <span className="badge bg-label-secondary">
                          {getEntryCodeLabel(entry.entryCode, t)}
                        </span>
                      )}
                      {stateText(entry.state)}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className={`fs-4 fw-bold ${isReversed ? '' : (isCredit ? 'text-success' : 'text-danger')}`}>
                    {isReversed ? '' : (isCredit ? '+' : '-')}{formatAmount(entry.amount)} <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>{entry.coinSymbol}</span>
                  </div>
                  <div className="text-muted">{formatUsd(entry.amountUsd)}</div>
                  {entry.networkName && <small className="text-muted">{entry.networkName}</small>}
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
                    {t('userLedger.details', { defaultValue: 'Details' })}
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{entry.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('userLedger.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="me-3" />
                            <div>
                              <span className="fw-medium">{entry.coinSymbol || 'N/A'}</span>
                              {entry.networkName && <small className="text-muted ms-1">/ {entry.networkName}</small>}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {entry.entryCode && (
                        <tr>
                          <td className="text-muted">{t('userLedger.code', { defaultValue: 'Entry Code' })}</td>
                          <td>
                            <span className="fw-medium font-monospace">{entry.entryCode}</span>
                            <span className="text-muted ms-2">({getEntryCodeLabel(entry.entryCode, t)})</span>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">{t('userLedger.state', { defaultValue: 'State' })}</td>
                        <td>{stateText(entry.state)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('userLedger.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className={`fw-bold ${isReversed ? '' : (isCredit ? 'text-success' : 'text-danger')}`}>
                            {isReversed ? '' : (isCredit ? '+' : '-')}{formatAmount(entry.amount)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD</td>
                        <td>{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('userLedger.usdRate', { defaultValue: 'USD Rate' })}</td>
                        <td>
                          {entry.usdRate ? formatUsd(entry.usdRate) : 'N/A'}
                          {entry.rateSource && <small className="text-muted ms-1">({entry.rateSource})</small>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Transaction & Timestamps */}
            <div className="col-md-6">
              {entry.txHash && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bx bx-link me-2"></i>
                      {t('userLedger.transaction', { defaultValue: 'Transaction' })}
                    </h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '40%' }}>{t('userLedger.txHash', { defaultValue: 'Tx Hash' })}</td>
                          <td>
                            <span className="font-monospace text-break" style={{ fontSize: '0.75rem' }}>{entry.txHash}</span>
                            <div className="d-flex gap-1 mt-2">
                              {entry.explorerUrl && (
                                <a href={`${entry.explorerUrl}/tx/${entry.txHash}`} target="_blank" rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                  <i className="bx bx-link-external me-1"></i>{t('userLedger.viewExplorer', { defaultValue: 'View on Explorer' })}
                                </a>
                              )}
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => copyToClipboard(entry.txHash)}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                <i className="bx bx-copy me-1"></i>{t('actions.copy', { defaultValue: 'Copy' })}
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-time me-2"></i>
                    {t('userLedger.timestamps', { defaultValue: 'Timestamps' })}
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('userLedger.createdAt', { defaultValue: 'Created' })}</td>
                        <td>{fmtDateTime(entry.createdAt)}</td>
                      </tr>
                      {entry.committedAt && (
                        <tr>
                          <td className="text-muted">{t('userLedger.committedAt', { defaultValue: 'Committed' })}</td>
                          <td>{fmtDateTime(entry.committedAt)}</td>
                        </tr>
                      )}
                      {entry.settledAt && (
                        <tr>
                          <td className="text-muted">{t('userLedger.settledAt', { defaultValue: 'Settled' })}</td>
                          <td>{fmtDateTime(entry.settledAt)}</td>
                        </tr>
                      )}
                      {entry.reversedAt && (
                        <tr>
                          <td className="text-muted">{t('userLedger.reversedAt', { defaultValue: 'Reversed' })}</td>
                          <td>{fmtDateTime(entry.reversedAt)}</td>
                        </tr>
                      )}
                      {entry.updatedAt && (
                        <tr>
                          <td className="text-muted">{t('userLedger.updatedAt', { defaultValue: 'Updated' })}</td>
                          <td>{fmtDateTime(entry.updatedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
