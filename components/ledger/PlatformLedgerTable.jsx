'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CoinImg from '@/components/CoinImg'
import { formatUsd, formatDate } from '@/lib/utils/format'

function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

function accountTypeBadge(type) {
  if (type === 'revenue') return <span>Revenue</span>
  if (type === 'expense') return <span>Expense</span>
  return <span className="text-muted">{type || 'N/A'}</span>
}

function stateBadge(state) {
  if (state === 'settled') return <span>Settled</span>
  if (state === 'committed') return <span>Committed</span>
  if (state === 'reversed') return <span>Reversed</span>
  return <span className="text-muted">{state || 'N/A'}</span>
}

export default function PlatformLedgerTable({
  entries,
  pagination,
  loading,
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
          <table className="table table-hover">
            <thead>
              <tr style={{ whiteSpace: 'nowrap' }}>
                <th>ID</th>
                <th>Account</th>
                <th>Type</th>
                <th>Coin</th>
                <th>Code</th>
                <th>State</th>
                <th className="text-end">Amount</th>
                <th className="text-end">USD</th>
                <th>Tx Hash</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center text-muted py-4">
                    {t('admin.platformLedger.noEntries', { defaultValue: 'No revenue & expense entries found' })}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isCredit = entry.entryType === 'credit'

                  return (
                    <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/platform-ledger/${entry.id}`)}>
                      <td>
                        <span className="fw-semibold text-primary">{entry.id}</span>
                      </td>
                      <td>
                        {accountTypeBadge(entry.accountType)}
                      </td>
                      <td>
                        <span className={`badge ${entry.state === 'reversed' ? 'bg-label-secondary' : (isCredit ? 'bg-label-success' : 'bg-label-danger')}`}>
                          <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} me-1`}></i>
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
                        <span className={`fw-medium ${entry.state === 'reversed' ? '' : (isCredit ? 'text-success' : 'text-danger')}`}>
                          {entry.state === 'reversed' ? '' : (isCredit ? '+' : '-')}{formatAmount(entry.amount)}
                        </span>
                      </td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                        <span className="text-muted">{formatUsd(entry.amountUsd)}</span>
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
                          href={`/admin/platform-ledger/${entry.id}`}
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
