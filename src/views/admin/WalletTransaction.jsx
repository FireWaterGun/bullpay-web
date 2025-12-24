import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import { getSystemWallet, getSystemWalletLedger } from '../../api/admin.ts'
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
    pol: ['polygon'],
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

export default function WalletTransaction() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { walletId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [ledger, setLedger] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [coinInfo, setCoinInfo] = useState(null) // เก็บข้อมูล coin/network ไว้
  const [filters, setFilters] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20,
    state: searchParams.get('state') || '',
    entryType: searchParams.get('entryType') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  })

  useEffect(() => {
    loadWallet()
  }, [walletId])

  useEffect(() => {
    if (wallet) {
      loadLedger()
    }
  }, [filters, wallet])

  async function loadWallet() {
    try {
      setLoading(true)
      const data = await getSystemWallet(token, parseInt(walletId))
      setWallet(data)
    } catch (error) {
      console.error('Failed to load wallet:', error)
      toast.error(t('admin.wallet.loadError', { defaultValue: 'Failed to load wallet details' }))
    }
  }

  async function loadLedger() {
    try {
      setLoading(true)
      const data = await getSystemWalletLedger(token, parseInt(walletId), filters)
      setLedger(data)
      
      // เก็บข้อมูล coin/network จาก transaction แรก (ถ้ามี)
      if (!coinInfo && data.items && data.items.length > 0 && data.items[0].metadata) {
        setCoinInfo({
          coin: data.items[0].metadata.coin,
          network: data.items[0].metadata.network
        })
      }
    } catch (error) {
      console.error('Failed to load ledger:', error)
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load transactions' }))
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key, value) {
    const newFilters = { ...filters, [key]: value, page: 1 }
    setFilters(newFilters)
    
    // Update URL query parameters
    const params = new URLSearchParams()
    if (newFilters.state) params.set('state', newFilters.state)
    if (newFilters.entryType) params.set('entryType', newFilters.entryType)
    if (newFilters.startDate) params.set('startDate', newFilters.startDate)
    if (newFilters.endDate) params.set('endDate', newFilters.endDate)
    if (newFilters.page > 1) params.set('page', newFilters.page.toString())
    setSearchParams(params)
  }

  function handlePageChange(newPage) {
    const newFilters = { ...filters, page: newPage }
    setFilters(newFilters)
    
    // Update URL query parameters
    const params = new URLSearchParams()
    if (newFilters.state) params.set('state', newFilters.state)
    if (newFilters.entryType) params.set('entryType', newFilters.entryType)
    if (newFilters.startDate) params.set('startDate', newFilters.startDate)
    if (newFilters.endDate) params.set('endDate', newFilters.endDate)
    if (newFilters.page > 1) params.set('page', newFilters.page.toString())
    setSearchParams(params)
  }

  if (loading && !ledger) {
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

  const items = ledger?.items || []
  const pagination = ledger?.pagination || {}
  const walletType = wallet?.walletType
  
  // ดึงข้อมูล coin/network จาก state ที่เก็บไว้ (ไม่หายเวลา filter)
  const coinSymbol = wallet?.coinNetwork?.coin?.symbol || coinInfo?.coin || items[0]?.metadata?.coin
  const networkSymbol = wallet?.coinNetwork?.network?.symbol || coinInfo?.network || items[0]?.metadata?.network

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/admin/system-wallet/balance')}
            className="btn btn-outline-secondary mb-3"
          >
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          {/* Header Card */}
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="mb-3">
                <i className="bx bx-receipt me-2 text-primary"></i>
                {t('admin.ledger.title', { defaultValue: 'Wallet Transactions' })}
              </h4>
              
              {/* Wallet Info - แสดงจาก wallet API เสมอ */}
              {wallet && (
                <div className="d-flex flex-wrap align-items-center gap-3">
                  {/* Coin Icon and Info - ดึงจาก wallet API หรือ items */}
                  {(coinSymbol || networkSymbol) && (
                    <>
                      <div className="d-flex align-items-center" style={{ minWidth: '200px' }}>
                        <CoinImg 
                          symbol={coinSymbol} 
                          networkSymbol={networkSymbol}
                          size={40}
                        />
                        <div>
                          <div className="fw-bold" style={{ fontSize: '1.125rem', lineHeight: 1.2 }}>
                            {coinSymbol || 'N/A'}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.813rem' }}>
                            {networkSymbol || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="vr" style={{ height: '40px', opacity: 0.2 }}></div>
                    </>
                  )}
                  
                  {/* Wallet Type - แสดงจาก wallet API */}
                  {walletType && (
                    <div>
                      <div className="text-muted small mb-1">
                        <i className="bx bx-category me-1"></i>
                        {t('admin.ledger.walletType', { defaultValue: 'Wallet Type' })}
                      </div>
                      {walletType === 'hot' ? (
                        <span className="badge bg-label-warning" style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>
                          <i className="bx bx-hot me-1"></i>
                          {t('admin.hot', { defaultValue: 'Hot' })}
                        </span>
                      ) : (
                        <span className="badge bg-label-info" style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>
                          <i className="bx bx-shield me-1"></i>
                          {t('admin.cold', { defaultValue: 'Cold' })}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Divider */}
                  {walletType && wallet.address && (
                    <div className="vr" style={{ height: '40px', opacity: 0.2 }}></div>
                  )}
                  
                  {/* Wallet Address - แสดงจาก wallet API */}
                  {wallet.address && (
                    <div className="flex-grow-1">
                      <div className="text-muted small mb-1">
                        <i className="bx bx-wallet me-1"></i>
                        {t('admin.ledger.walletAddress', { defaultValue: 'Wallet Address' })}
                      </div>
                      <code className="text-primary" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {wallet.address}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filters Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bx bx-filter me-2"></i>
                {t('admin.ledger.filters', { defaultValue: 'Filters' })}
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">{t('admin.ledger.state', { defaultValue: 'State' })}</label>
                  <select
                    className="form-select"
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                  >
                    <option value="">{t('admin.ledger.allStates', { defaultValue: 'All States' })}</option>
                    <option value="committed">{t('admin.ledger.committed', { defaultValue: 'Committed' })}</option>
                    <option value="settled">{t('admin.ledger.settled', { defaultValue: 'Settled' })}</option>
                    <option value="reversed">{t('admin.ledger.reversed', { defaultValue: 'Reversed' })}</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('admin.ledger.entryType', { defaultValue: 'Entry Type' })}</label>
                  <select
                    className="form-select"
                    value={filters.entryType}
                    onChange={(e) => handleFilterChange('entryType', e.target.value)}
                  >
                    <option value="">{t('admin.ledger.allTypes', { defaultValue: 'All Types' })}</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('admin.ledger.startDate', { defaultValue: 'Start Date' })}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('admin.ledger.endDate', { defaultValue: 'End Date' })}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bx bx-list-ul me-2 text-primary"></i>
                  {t('admin.ledger.transactions', { defaultValue: 'Transactions' })}
                </h5>
                <div>
                  <span className="badge bg-primary" style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>
                    {pagination.total || 0} {t('admin.ledger.entries', { defaultValue: 'entries' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="bx bx-receipt" style={{ fontSize: '4rem', opacity: 0.3, color: '#666' }}></i>
                  </div>
                  <h6 className="text-muted mb-2">
                    {t('admin.ledger.noEntries', { defaultValue: 'No transactions found' })}
                  </h6>
                  <p className="text-muted small mb-0">
                    {t('admin.ledger.noEntriesDesc', { defaultValue: 'Try adjusting your filters to see more results' })}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover" style={{ minWidth: '1800px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '60px', whiteSpace: 'nowrap' }}>{t('admin.ledger.id', { defaultValue: 'ID' })}</th>
                        <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
                        <th className="text-end" style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
                        <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
                        <th style={{ minWidth: '200px', whiteSpace: 'nowrap' }}>{t('admin.ledger.reservationId', { defaultValue: 'Reservation ID' })}</th>
                        <th style={{ minWidth: '500px', whiteSpace: 'nowrap' }}>{t('admin.ledger.txHash', { defaultValue: 'Transaction Hash' })}</th>
                        <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>{t('admin.ledger.createdAt', { defaultValue: 'Created At' })}</th>
                        <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>{t('admin.ledger.committedAt', { defaultValue: 'Committed At' })}</th>
                        <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>{t('admin.ledger.settledAt', { defaultValue: 'Settled At' })}</th>
                        <th style={{ minWidth: '300px', whiteSpace: 'nowrap' }}>{t('admin.ledger.note', { defaultValue: 'Note' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const decimals = item.decimals || 18
                        const amount = AmountNormalizer.fromRawSimple(item.amountRaw || '0', decimals)
                        
                        // Parse metadata JSON string
                        let metadata = {}
                        try {
                          metadata = typeof item.metadata === 'string' 
                            ? JSON.parse(item.metadata) 
                            : item.metadata || {}
                        } catch (e) {
                          console.error('Failed to parse metadata:', e)
                        }
                        
                        const coinSymbol = metadata?.coin || ''
                        const networkSymbol = metadata?.network || ''
                        const explorerUrl = networkSymbol === 'POL' || networkSymbol === 'MATIC'
                          ? 'https://polygonscan.com'
                          : networkSymbol === 'ETH'
                          ? 'https://etherscan.io'
                          : networkSymbol === 'BSC'
                          ? 'https://bscscan.com'
                          : null
                        
                        return (
                          <tr key={item.id}>
                            <td>
                              {item.id}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {item.entryType === 'credit' ? (
                                <span className="badge bg-label-info">
                                  <i className="bx bx-plus-circle me-1"></i>
                                  {t('admin.ledger.credit', { defaultValue: 'Credit' })}
                                </span>
                              ) : (
                                <span className="badge bg-label-primary">
                                  <i className="bx bx-minus-circle me-1"></i>
                                  {t('admin.ledger.debit', { defaultValue: 'Debit' })}
                                </span>
                              )}
                            </td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <span>
                                {item.entryType === 'credit' ? '+' : '-'}
                                {parseFloat(amount).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 8
                                })}
                                {' '}
                                <span className="text-muted">{coinSymbol || wallet?.coinNetwork?.coin?.symbol || ''}</span>
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {item.state === 'settled' ? (
                                <span className="badge bg-label-success">
                                  <i className="bx bx-check-double me-1"></i>
                                  {t('admin.ledger.settled', { defaultValue: 'Settled' })}
                                </span>
                              ) : item.state === 'committed' ? (
                                <span className="badge bg-label-info">
                                  <i className="bx bx-check-circle me-1"></i>
                                  {t('admin.ledger.committed', { defaultValue: 'Committed' })}
                                </span>
                              ) : item.state === 'pending' ? (
                                <span className="badge bg-label-warning">
                                  <i className="bx bx-time me-1"></i>
                                  {t('admin.ledger.pending', { defaultValue: 'Pending' })}
                                </span>
                              ) : item.state === 'reversed' ? (
                                <span className="badge bg-label-danger">
                                  <i className="bx bx-revision me-1"></i>
                                  {t('admin.ledger.reversed', { defaultValue: 'Reversed' })}
                                </span>
                              ) : (
                                <span className="badge bg-label-secondary">
                                  {item.state || 'N/A'}
                                </span>
                              )}
                            </td>
                            <td>
                              {item.reservationId ? (
                                <span>{item.reservationId}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {item.txHash ? (
                                <div className="d-flex align-items-center gap-2">
                                  <span>
                                    {item.txHash}
                                  </span>
                                  {explorerUrl && (
                                    <a
                                      href={`${explorerUrl}/tx/${item.txHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-icon btn-outline-primary flex-shrink-0"
                                      style={{ padding: '0.25rem 0.4rem' }}
                                      title={t('actions.viewOnExplorer', { defaultValue: 'View on Explorer' })}
                                    >
                                      <i className="bx bx-link-external" style={{ fontSize: '14px' }}></i>
                                    </a>
                                  )}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.txHash)
                                      toast.success(t('actions.copied', { defaultValue: 'Copied!' }))
                                    }}
                                    className="btn btn-sm btn-icon btn-outline-secondary flex-shrink-0"
                                    style={{ padding: '0.25rem 0.4rem' }}
                                    title={t('actions.copy', { defaultValue: 'Copy' })}
                                  >
                                    <i className="bx bx-copy" style={{ fontSize: '14px' }}></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.813rem' }}>
                                {new Date(item.createdAt).toLocaleString()}
                              </div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {item.committedAt ? (
                                <div style={{ fontSize: '0.813rem' }}>
                                  {new Date(item.committedAt).toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {item.settledAt ? (
                                <div style={{ fontSize: '0.813rem' }}>
                                  {new Date(item.settledAt).toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {metadata?.note || metadata?.invoiceNumber ? (
                                <div className="small">
                                  {metadata?.invoiceNumber && (
                                    <div className="mb-1">
                                      <span className="badge bg-label-primary">{metadata.invoiceNumber}</span>
                                    </div>
                                  )}
                                  {metadata?.note && (
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                      {metadata.note}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

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
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      <i className="bx bx-chevron-left"></i>
                      {t('actions.previous', { defaultValue: 'Previous' })}
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
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
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
