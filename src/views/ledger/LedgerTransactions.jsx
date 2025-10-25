import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getLedgerEntries } from '../../api/admin.ts'
import { AmountNormalizer } from '../../utils/amount_normalizer'

// Coin asset helpers
function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'],
    eth: ['ethereum'],
    doge: ['dogecoin'],
    sol: ['solana'],
    matic: ['polygon'],
    ada: ['cardano'],
    xmr: ['monero'],
    zec: ['zcash'],
    usdt: ['usdterc20', 'tether'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) =>
    exts.map((ext) => `/assets/img/coins/${n}.${ext}`)
  )
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    '/assets/img/coins/default.svg',
  ]
  return Array.from(new Set(candidates))
}

function CoinImg({ coin, symbol, networkSymbol, size = 32 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl),
    [coin?.logoUrl, symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null),
    [networkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 18
  
  return (
    <div className="position-relative me-3" style={{ width: size, height: size }}>
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
        onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
      />
      {networkSymbol && networkSymbol !== symbol && 
       !(symbol === 'POL' && networkSymbol === 'MATIC') && (
        <div 
          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
          style={{
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '2px'
          }}
        >
          <img
            src={netSrc}
            alt={networkSymbol}
            width={badgeSize - 4}
            height={badgeSize - 4}
            className="rounded-circle"
            style={{ objectFit: 'cover' }}
            onError={() => setNetIdx((i) => (i + 1 < networkCandidates.length ? i + 1 : i))}
          />
        </div>
      )}
    </div>
  )
}

export default function LedgerTransactions() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    loadLedgerEntries()
  }, [currentPage, typeFilter])

  async function loadLedgerEntries() {
    try {
      setLoading(true)
      const data = await getLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        type: typeFilter || undefined
      })
      setLedgerEntries(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load ledger entries:', error)
      toast.error(t('ledger.loadError', { defaultValue: 'Failed to load ledger entries' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals = 18) {
    if (!amountRaw) return '0'
    try {
      return AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
    } catch (e) {
      return amountRaw.toString()
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    }).catch(() => {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    })
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  function typeBadgeClass(type) {
    const v = String(type || '').toLowerCase()
    if (v === 'deposit' || v === 'payment_received') return 'badge bg-label-success'
    if (v === 'withdrawal') return 'badge bg-label-danger'
    if (v === 'sweep' || v === 'fee') return 'badge bg-label-info'
    return 'badge bg-label-secondary'
  }

  function walletTypeBadgeClass(type) {
    const v = String(type || '').toLowerCase()
    if (v === 'user') return 'badge bg-label-primary'
    if (v === 'system') return 'badge bg-label-warning'
    return 'badge bg-label-secondary'
  }

  if (loading && ledgerEntries.length === 0) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-book me-2"></i>
                    {t('ledger.transactions', { defaultValue: 'Ledger Transactions' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('ledger.transactionsDesc', { defaultValue: 'View all ledger entries and their status' })}
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <select 
                    className="form-select" 
                    value={typeFilter} 
                    onChange={(e) => {
                      setTypeFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    style={{ width: 'auto' }}
                  >
                    <option value="">{t('common.allTypes', { defaultValue: 'All Types' })}</option>
                    <option value="payment_received">{t('ledger.paymentReceived', { defaultValue: 'Payment Received' })}</option>
                    <option value="payment_sent">{t('ledger.paymentSent', { defaultValue: 'Payment Sent' })}</option>
                    <option value="withdrawal">{t('ledger.withdrawal', { defaultValue: 'Withdrawal' })}</option>
                    <option value="deposit">{t('ledger.deposit', { defaultValue: 'Deposit' })}</option>
                    <option value="sweep">{t('ledger.sweep', { defaultValue: 'Sweep' })}</option>
                    <option value="fee">{t('ledger.fee', { defaultValue: 'Fee' })}</option>
                    <option value="refund">{t('ledger.refund', { defaultValue: 'Refund' })}</option>
                    <option value="reversal">{t('ledger.reversal', { defaultValue: 'Reversal' })}</option>
                    <option value="adjustment">{t('ledger.adjustment', { defaultValue: 'Adjustment' })}</option>
                    <option value="interest">{t('ledger.interest', { defaultValue: 'Interest' })}</option>
                    <option value="penalty">{t('ledger.penalty', { defaultValue: 'Penalty' })}</option>
                    <option value="bonus">{t('ledger.bonus', { defaultValue: 'Bonus' })}</option>
                    <option value="commission">{t('ledger.commission', { defaultValue: 'Commission' })}</option>
                    <option value="exchange">{t('ledger.exchange', { defaultValue: 'Exchange' })}</option>
                    <option value="transfer_in">{t('ledger.transferIn', { defaultValue: 'Transfer In' })}</option>
                    <option value="transfer_out">{t('ledger.transferOut', { defaultValue: 'Transfer Out' })}</option>
                  </select>
                  <button className="btn btn-primary" onClick={loadLedgerEntries} disabled={loading}>
                    <i className="bx bx-refresh me-1"></i>
                    {t('actions.refresh', { defaultValue: 'Refresh' })}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover" style={{ minWidth: '1600px' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '60px' }}>ID</th>
                      <th style={{ minWidth: '150px' }}>{t('ledger.user', { defaultValue: 'User' })}</th>
                      <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>{t('ledger.walletType', { defaultValue: 'Wallet Type' })}</th>
                      <th style={{ minWidth: '120px' }}>{t('ledger.type', { defaultValue: 'Type' })}</th>
                      <th style={{ minWidth: '100px' }}>{t('ledger.chain', { defaultValue: 'Chain' })}</th>
                      <th style={{ minWidth: '220px' }}>{t('ledger.coin', { defaultValue: 'Coin' })}</th>
                      <th style={{ minWidth: '140px' }}>{t('ledger.amount', { defaultValue: 'Amount' })}</th>
                      <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>{t('ledger.balanceAfter', { defaultValue: 'Balance After' })}</th>
                      <th style={{ minWidth: '200px' }}>{t('ledger.reference', { defaultValue: 'Reference' })}</th>
                      <th style={{ minWidth: '300px' }}>{t('ledger.note', { defaultValue: 'Note' })}</th>
                      <th style={{ minWidth: '140px' }}>{t('ledger.createdAt', { defaultValue: 'Created Date' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('ledger.noEntries', { defaultValue: 'No ledger entries found' })}
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <span className="fw-semibold text-primary">{entry.id}</span>
                          </td>
                          <td>
                            <span>{entry.user?.email || 'N/A'}</span>
                          </td>
                          <td>
                            <span>
                              {String(entry.walletType || 'N/A').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span>
                              {String(entry.type || 'N/A').replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted">
                              {(entry.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {entry.coinNetwork && (
                                <>
                                  <CoinImg 
                                    symbol={entry.coinNetwork.coin?.symbol || entry.symbol}
                                    networkSymbol={entry.coinNetwork.network?.symbol}
                                    size={24}
                                  />
                                  <div className="ms-2">
                                    <div>{entry.coinNetwork.coin?.symbol || entry.symbol || 'N/A'}</div>
                                    <small className="text-muted">{entry.coinNetwork.network?.name || 'N/A'}</small>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={entry.type === 'deposit' || entry.type === 'payment_received' ? 'text-success' : 'text-danger'}>
                              {(entry.type === 'deposit' || entry.type === 'payment_received') ? '+' : '-'}
                              {formatAmount(entry.amountRaw || entry.amount, entry.decimals || 18)}
                            </span>
                          </td>
                          <td>
                            <span>
                              {entry.balanceAfterRaw ? formatAmount(entry.balanceAfterRaw, entry.decimals || 18) : '-'}
                            </span>
                          </td>
                          <td>
                            <div>
                              <div>
                                <span>{entry.referenceType || '-'}</span>
                                {entry.relatedId && <span className="text-muted"> #{entry.relatedId}</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted" style={{ wordBreak: 'break-word' }}>{entry.note || '-'}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.createdAt)}</span>
                          </td>
                        </tr>
                      ))
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
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <i className="bx bx-chevron-left"></i>
                      {t('actions.prev', { defaultValue: 'Previous' })}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled
                    >
                      {pagination.page} / {pagination.totalPages}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      {t('actions.next', { defaultValue: 'Next' })}
                      <i className="bx bx-chevron-right"></i>
                    </button>
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
