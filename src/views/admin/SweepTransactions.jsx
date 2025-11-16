import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getSweeps } from '../../api/admin.ts'
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

export default function SweepTransactions() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [sweeps, setSweeps] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadSweeps()
  }, [currentPage, statusFilter])

  async function loadSweeps() {
    try {
      setLoading(true)
      const data = await getSweeps(token, {
        page: currentPage,
        limit: 20,
        status: statusFilter || undefined
      })
      // Support new API structure with data.sweeps and data.meta
      setSweeps(data.sweeps || data.items || [])
      
      // Map new meta structure to old pagination format
      const meta = data.meta || data.pagination
      if (meta) {
        setPagination({
          page: meta.currentPage || meta.page || currentPage,
          limit: meta.perPage || meta.limit || 20,
          total: meta.total || 0,
          totalPages: meta.lastPage || meta.totalPages || 1,
          hasPrev: meta.previousPageUrl !== null || (meta.currentPage || meta.page || 1) > 1,
          hasNext: meta.nextPageUrl !== null || (meta.currentPage || meta.page || 1) < (meta.lastPage || meta.totalPages || 1)
        })
      } else {
        setPagination(null)
      }
    } catch (error) {
      console.error('Failed to load sweep transactions:', error)
      toast.error(t('admin.sweep.loadError', { defaultValue: 'Failed to load sweep transactions' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals, coinSymbol, networkSymbol) {
    if (!amountRaw || !decimals) return '0'
    
    try {
      // ใช้ AmountNormalizer.detectChain() แทนการ hardcode chainMap
      const chain = AmountNormalizer.detectChain(coinSymbol || '', networkSymbol || '')
      return AmountNormalizer.fromRaw(amountRaw.toString(), chain, decimals)
    } catch (error) {
      console.error('Failed to format amount:', error)
      // Fallback to simple calculation
      const amount = Number(amountRaw) / Math.pow(10, decimals)
      return amount.toString()
    }
  }

  function formatAddress(address) {
    if (!address) return 'N/A'
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
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

  function statusBadgeClass(s) {
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  if (loading && sweeps.length === 0) {
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
                    <i className="bx bx-transfer me-2"></i>
                    {t('admin.sweep.transactions', { defaultValue: 'Sweep Transactions' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.sweep.transactionsDesc', { defaultValue: 'View all sweep transactions and their status' })}
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
                    <option value="pending">{t('admin.sweep.pending', { defaultValue: 'Pending' })}</option>
                    <option value="processing">{t('admin.sweep.processing', { defaultValue: 'Processing' })}</option>
                    <option value="completed">{t('admin.sweep.completed', { defaultValue: 'Completed' })}</option>
                    <option value="failed">{t('admin.sweep.failed', { defaultValue: 'Failed' })}</option>
                    <option value="cancelled">{t('admin.sweep.cancelled', { defaultValue: 'Cancelled' })}</option>
                  </select>
                  <button className="btn btn-primary" onClick={loadSweeps} disabled={loading}>
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
                      <th style={{ minWidth: '100px' }}>{t('admin.chain', { defaultValue: 'Chain' })}</th>
                      <th style={{ minWidth: '180px' }}>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
                      <th style={{ minWidth: '150px' }}>{t('admin.sweep.amount', { defaultValue: 'Amount' })}</th>
                      <th style={{ minWidth: '100px' }}>{t('admin.sweep.status', { defaultValue: 'Status' })}</th>
                      <th style={{ minWidth: '420px' }}>{t('admin.sweep.from', { defaultValue: 'From' })}</th>
                      <th style={{ minWidth: '420px' }}>{t('admin.sweep.to', { defaultValue: 'To' })}</th>
                      <th style={{ minWidth: '680px' }}>{t('admin.sweep.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th style={{ minWidth: '140px' }}>{t('admin.sweep.createdAt', { defaultValue: 'Created Date' })}</th>
                      <th style={{ minWidth: '140px' }}>{t('admin.sweep.completedAt', { defaultValue: 'Completed Date' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sweeps.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('admin.sweep.noTransactions', { defaultValue: 'No sweep transactions found' })}
                        </td>
                      </tr>
                    ) : (
                      sweeps.map((sweep) => (
                        <tr key={sweep.id}>
                          <td>
                            <span className="fw-semibold text-primary">{sweep.id}</span>
                          </td>
                          <td>
                            <span>{sweep.user?.email || 'N/A'}</span>
                          </td>
                          <td>
                            <span className="text-muted">
                              {(sweep.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {sweep.coinNetwork?.coin && (
                                <>
                                  <CoinImg 
                                    symbol={sweep.coinNetwork.coin.symbol}
                                    networkSymbol={sweep.coinNetwork.network?.symbol}
                                    size={24}
                                  />
                                  <div className="ms-2">
                                    <div>{sweep.coinNetwork.coin.symbol}</div>
                                    <small className="text-muted">{sweep.coinNetwork.network?.name}</small>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <span>
                              {formatAmount(
                                sweep.amountRaw, 
                                sweep.decimals, 
                                sweep.coinNetwork?.coin?.symbol,
                                sweep.coinNetwork?.network?.symbol
                              )}{' '}
                              <span className="text-muted">{sweep.coinNetwork?.coin?.symbol || ''}</span>
                            </span>
                          </td>
                          <td className="text-nowrap"><span className={statusBadgeClass(sweep.status)}>{String(sweep.status || '').toUpperCase()}</span></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {sweep.fromAddress || 'N/A'}
                              </span>
                              {sweep.fromAddress && (
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => copyToClipboard(sweep.fromAddress)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {sweep.toAddress || 'N/A'}
                              </span>
                              {sweep.toAddress && (
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => copyToClipboard(sweep.toAddress)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            {sweep.txHash ? (
                              <div className="d-flex align-items-center">
                                <span className="me-2">
                                  {sweep.txHash}
                                </span>
                                <a 
                                  href={`${sweep.coinNetwork?.network?.explorerUrl}/tx/${sweep.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  title="View on explorer"
                                >
                                  <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(sweep.createdAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>
                              {sweep.completedAt ? formatDate(sweep.completedAt) : <span className="text-muted">-</span>}
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
