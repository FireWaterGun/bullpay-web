'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'

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
  return t ? t(`userLedger.code.${code}`, { defaultValue: ENTRY_CODE_LABELS[code] || code }) : (ENTRY_CODE_LABELS[code] || code)
}

function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) str = str.replace(/0+$/, '').replace(/\.$/, '')
  return str || '0'
}

function stateText(state, t) {
  if (state === 'settled') return <span className="badge bg-label-success">{t('userLedger.settled', { defaultValue: 'Settled' })}</span>
  if (state === 'committed') return <span className="badge bg-label-info">{t('userLedger.committed', { defaultValue: 'Committed' })}</span>
  if (state === 'reversed') return <span className="badge bg-label-secondary">{t('userLedger.reversed', { defaultValue: 'Reversed' })}</span>
  return <span className="text-muted">{state || 'N/A'}</span>
}

export default function MyLedgerTable({
  entries,
  pagination,
  loading,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters,
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const { fmtDate } = useDateFormat()

  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table table-hover" style={{ minWidth: '900px' }}>
            <thead>
              <tr style={{ whiteSpace: 'nowrap' }}>
                <th>{t('userLedger.id', { defaultValue: 'ID' })}</th>
                <th>{t('userLedger.coin', { defaultValue: 'Coin' })}</th>
                <th>{t('userLedger.code', { defaultValue: 'Code' })}</th>
                <th>{t('userLedger.state', { defaultValue: 'State' })}</th>
                <th className="text-end">{t('userLedger.amount', { defaultValue: 'Amount' })}</th>
                <th className="text-end">{t('userLedger.usd', { defaultValue: 'USD' })}</th>
                <th>{t('userLedger.txHash', { defaultValue: 'Tx Hash' })}</th>
                <th>{t('userLedger.createdAt', { defaultValue: 'Created' })}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    {t('userLedger.noEntries', { defaultValue: 'No ledger entries found' })}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isCredit = entry.entryType === 'credit'

                  return (
                    <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/ledger/${entry.id}`)}>
                      <td>
                        <span className="fw-semibold text-primary">{entry.id}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="d-flex align-items-center">
                          <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="me-2" />
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
                          <span className="me-2" title={getEntryCodeLabel(entry.entryCode, t)}>{entry.entryCode}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{stateText(entry.state, t)}</td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                        <span className="fw-medium">
                          {isCredit ? '+' : '-'}{formatAmount(entry.amount)}
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
                              <a href={`${entry.explorerUrl}/tx/${entry.txHash}`} target="_blank" rel="noopener noreferrer"
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                onClick={(e) => e.stopPropagation()} title={t('userLedger.viewExplorer', { defaultValue: 'View on Explorer' })}>
                                <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(entry.createdAt)}</span>
                      </td>
                      <td>
                        <Link href={`/ledger/${entry.id}`} className="btn btn-sm btn-icon btn-outline-primary"
                          onClick={(e) => e.stopPropagation()}
                          title={t('actions.view', { defaultValue: 'View' })}>
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

        {/* Pagination */}
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
              <button className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasPrev || loading}
                onClick={() => { setCurrentPage(p => p - 1); syncSearchParams(appliedFilters, currentPage - 1) }}>
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button className="btn btn-outline-secondary btn-sm" disabled>
                {pagination.page} / {pagination.totalPages}
              </button>
              <button className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasNext || loading}
                onClick={() => { setCurrentPage(p => p + 1); syncSearchParams(appliedFilters, currentPage + 1) }}>
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
