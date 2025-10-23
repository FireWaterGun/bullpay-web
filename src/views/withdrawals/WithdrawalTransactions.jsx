import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getWithdrawals } from '../../api/admin.ts'
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

export default function WithdrawalTransactions() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadWithdrawals()
  }, [currentPage, statusFilter])

  async function loadWithdrawals() {
    try {
      setLoading(true)
      const data = await getWithdrawals(token, {
        page: currentPage,
        limit: 20,
        status: statusFilter || undefined
      })
      setWithdrawals(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load withdrawal transactions:', error)
      toast.error(t('withdrawal.loadError', { defaultValue: 'Failed to load withdrawal transactions' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amount) {
    if (!amount) return '0'
    return amount
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

  function getStatusBadge(status) {
    const statusConfig = {
      PENDING: { class: 'bg-label-warning', icon: 'bx-time-five', text: 'Pending' },
      PROCESSING: { class: 'bg-label-info', icon: 'bx-loader-circle', text: 'Processing' },
      COMPLETED: { class: 'bg-label-success', icon: 'bx-check-circle', text: 'Completed' },
      FAILED: { class: 'bg-label-danger', icon: 'bx-x-circle', text: 'Failed' },
      CANCELLED: { class: 'bg-label-secondary', icon: 'bx-block', text: 'Cancelled' }
    }
    const config = statusConfig[status] || { class: 'bg-label-secondary', icon: 'bx-info-circle', text: status }
    return (
      <span className={`badge ${config.class}`}>
        <i className={`bx ${config.icon} me-1`}></i>
        {config.text}
      </span>
    )
  }

  if (loading && withdrawals.length === 0) {
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
                    <i className="bx bx-money-withdraw me-2"></i>
                    {t('withdrawal.transactions', { defaultValue: 'Withdrawal Transactions' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('withdrawal.transactionsDesc', { defaultValue: 'View all withdrawal transactions and their status' })}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select" 
                    value={statusFilter} 
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    style={{ width: 'auto' }}
                  >
                    <option value="">{t('common.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="PENDING">{t('withdrawal.pending', { defaultValue: 'Pending' })}</option>
                    <option value="PROCESSING">{t('withdrawal.processing', { defaultValue: 'Processing' })}</option>
                    <option value="COMPLETED">{t('withdrawal.completed', { defaultValue: 'Completed' })}</option>
                    <option value="FAILED">{t('withdrawal.failed', { defaultValue: 'Failed' })}</option>
                    <option value="CANCELLED">{t('withdrawal.cancelled', { defaultValue: 'Cancelled' })}</option>
                  </select>
                  <button className="btn btn-primary" onClick={loadWithdrawals} disabled={loading}>
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
                <table className="table table-hover" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '60px' }}>ID</th>
                      <th style={{ minWidth: '150px' }}>{t('admin.user', { defaultValue: 'User' })}</th>
                      <th style={{ minWidth: '100px' }}>{t('withdrawal.chain', { defaultValue: 'Chain' })}</th>
                      <th style={{ minWidth: '120px' }}>{t('withdrawal.coin', { defaultValue: 'Coin' })}</th>
                      <th style={{ minWidth: '120px' }}>{t('withdrawal.amount', { defaultValue: 'Amount' })}</th>
                      <th style={{ minWidth: '80px' }}>{t('withdrawal.fee', { defaultValue: 'Fee' })}</th>
                      <th style={{ minWidth: '100px' }}>{t('withdrawal.status', { defaultValue: 'Status' })}</th>
                      <th style={{ minWidth: '420px' }}>{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</th>
                      <th style={{ minWidth: '680px' }}>{t('withdrawal.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th style={{ minWidth: '140px' }}>{t('withdrawal.createdAt', { defaultValue: 'Created Date' })}</th>
                      <th style={{ minWidth: '140px' }}>{t('withdrawal.completedAt', { defaultValue: 'Completed Date' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('withdrawal.noTransactions', { defaultValue: 'No withdrawal transactions found' })}
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td>
                            <span className="fw-semibold text-primary">{withdrawal.id}</span>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{withdrawal.user?.email || 'N/A'}</div>
                              {withdrawal.user?.username && (
                                <small className="text-muted">@{withdrawal.user.username}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="text-muted fw-medium">
                              {withdrawal.coinNetwork?.symbol || withdrawal.coinNetwork?.name || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {withdrawal.coinNetwork && (
                                <>
                                  <CoinImg 
                                    symbol={withdrawal.coinNetwork.symbol}
                                    networkSymbol={null}
                                    size={24}
                                  />
                                  <div className="ms-2">
                                    <div className="fw-medium">{withdrawal.coinNetwork.symbol}</div>
                                    <small className="text-muted">{withdrawal.coinNetwork.name}</small>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="fw-medium">{formatAmount(withdrawal.amount)}</span>
                          </td>
                          <td>
                            <span className="text-muted">{formatAmount(withdrawal.fee)}</span>
                          </td>
                          <td>{getStatusBadge(withdrawal.status)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <code className="text-success me-2" style={{ fontSize: '0.75rem' }}>
                                {withdrawal.toAddress || 'N/A'}
                              </code>
                              {withdrawal.toAddress && (
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => copyToClipboard(withdrawal.toAddress)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy"></i>
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            {withdrawal.txHash ? (
                              <div className="d-flex align-items-center">
                                <code className="text-primary me-2" style={{ fontSize: '0.75rem' }}>
                                  {withdrawal.txHash}
                                </code>
                                <a 
                                  href={`${withdrawal.coinNetwork?.network?.explorerUrl}/tx/${withdrawal.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  title="View on explorer"
                                >
                                  <i className="bx bx-link-external"></i>
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(withdrawal.createdAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>
                              {withdrawal.completedAt ? formatDate(withdrawal.completedAt) : <span className="text-muted">-</span>}
                            </span>
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
