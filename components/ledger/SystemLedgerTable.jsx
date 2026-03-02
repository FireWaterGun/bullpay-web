'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatUsd, formatDate } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'

function parseMetadata(entry) {
  try {
    return typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
  } catch { return {} }
}

function getPurposeLabel(metadata) {
  if (!metadata) return null
  const purposeMap = {
    'payment_received': 'Payment Received',
    'merchant_credit': 'Merchant Credit',
    'native_coin_sweep_cost': 'Sweep Cost',
    'gas_topup_for_token_sweep': 'Gas Top-up',
    'token_sweep_cost': 'Token Sweep Cost',
  }
  return purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null
}

function stateBadge(state) {
  if (state === 'settled') return <span>Settled</span>
  if (state === 'committed') return <span>Committed</span>
  if (state === 'pending') return <span>Pending</span>
  if (state === 'reversed') return <span>Reversed</span>
  return <span className="text-muted">{state || 'N/A'}</span>
}

function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

export default function SystemLedgerTable({
  entries,
  loading,
  pagination,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters,
}) {
  const { t } = useAdminTranslation()
  const router = useRouter()

  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table table-hover" style={{ minWidth: '1200px' }}>
            <thead>
              <tr style={{ whiteSpace: 'nowrap' }}>
                <th>ID</th>
                <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
                <th>{t('admin.ledger.coin', { defaultValue: 'Coin' })}</th>
                <th>Code</th>
                <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
                <th className="text-end">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
                <th className="text-end">USD</th>
                <th>Purpose</th>
                <th>Tx Hash</th>
                <th>{t('admin.ledger.createdAt', { defaultValue: 'Created' })}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center text-muted py-4">
                    {t('admin.ledger.noEntries', { defaultValue: 'No ledger entries found' })}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isCredit = entry.entryType === 'credit'
                  const metadata = parseMetadata(entry)
                  const purposeLabel = getPurposeLabel(metadata)

                  return (
                    <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/system-ledger/${entry.id}`)}>
                      <td>
                        <span className="fw-semibold text-primary">{entry.id}</span>
                      </td>
                      <td>
                        <span className={`badge ${entry.state === 'reversed' ? 'bg-label-secondary' : (isCredit ? 'bg-label-danger' : 'bg-label-success')}`}>
                          <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} me-1`}></i>
                          {isCredit ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="d-flex align-items-center">
                          <CoinImg
                            symbol={entry.coinSymbol}
                            networkSymbol={entry.networkSymbol}
                            size={24}
                            className="me-2"
                          />
                          <div>
                            <div className="fw-medium" style={{ lineHeight: 1.2 }}>{entry.coinSymbol || '-'}</div>
                            {entry.networkName && (
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.networkName}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {entry.entryCode ? (
                          <span className="fw-medium">{entry.entryCode}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {stateBadge(entry.state)}
                      </td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                        <span className={`fw-medium ${entry.state === 'reversed' ? '' : (isCredit ? 'text-danger' : 'text-success')}`}>
                          {entry.state === 'reversed' ? '' : (isCredit ? '-' : '+')}{formatAmount(entry.amount)}
                        </span>
                      </td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                        <span className="text-muted">{formatUsd(entry.amountUsd)}</span>
                      </td>
                      <td>
                        <div>
                          {purposeLabel && (
                            <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{purposeLabel}</div>
                          )}
                          {metadata?.invoiceNumber && (
                            <small className="badge bg-label-primary">{metadata.invoiceNumber}</small>
                          )}
                          {metadata?.sweepId && !metadata?.invoiceNumber && (
                            <small className="text-muted">Sweep #{metadata.sweepId}</small>
                          )}
                          {!purposeLabel && !metadata?.invoiceNumber && !metadata?.sweepId && (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {entry.txHash ? (
                          <div className="d-flex align-items-center">
                            <span className="me-2">{entry.txHash}</span>
                            {entry.explorerUrl && (
                              <a
                                href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                onClick={(e) => e.stopPropagation()}
                                title="View on explorer"
                              >
                                <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.createdAt)}</span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/system-ledger/${entry.id}`}
                          className="btn btn-sm btn-icon btn-outline-primary"
                          onClick={(e) => e.stopPropagation()}
                          title={t('actions.view', { defaultValue: 'View' })}
                        >
                          <i className="bx bx-show"></i>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted small">
              {t('invoices.showingEntries', {
                start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
                defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
              })}
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasPrev || loading}
                onClick={() => { setCurrentPage(p => p - 1); syncSearchParams(appliedFilters, currentPage - 1) }}
              >
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button className="btn btn-outline-secondary btn-sm" disabled>
                {pagination.page} / {pagination.totalPages}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasNext || loading}
                onClick={() => { setCurrentPage(p => p + 1); syncSearchParams(appliedFilters, currentPage + 1) }}
              >
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
