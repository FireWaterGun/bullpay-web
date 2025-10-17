import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCoinNetworks, getCoins, getNetworks } from '../../api/admin.ts'

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
    usdc: ['usd-coin'],
    bnb: ['binance'],
    bsc: ['binance'],
    trx: ['tron'],
    arb: ['arbitrum'],
    op: ['optimism'],
    base: ['base'],
    ln: ['lightning'],
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

function CoinImg({ coin, symbol, networkSymbol, size = 40 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const [showCoinFallback, setShowCoinFallback] = useState(false)
  const [showNetFallback, setShowNetFallback] = useState(false)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl).filter(c => !c.includes('default.svg')),
    [coin?.logoUrl, symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null).filter(c => !c.includes('default.svg')),
    [networkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 20
  
  const handleCoinError = () => {
    if (idx + 1 < candidates.length) {
      setIdx(i => i + 1)
    } else {
      setShowCoinFallback(true)
    }
  }
  
  const handleNetError = () => {
    if (netIdx + 1 < networkCandidates.length) {
      setNetIdx(i => i + 1)
    } else {
      setShowNetFallback(true)
    }
  }
  
  // ไม่แสดง network badge ถ้าไปถึง default icon แล้ว (ไม่มี icon)
  const isNetworkIconAvailable = networkCandidates.length > 0 && !showNetFallback
  const showNetworkBadge = networkSymbol && 
                           networkSymbol !== symbol && 
                           !(symbol === 'POL' && networkSymbol === 'MATIC') &&
                           isNetworkIconAvailable
  
  const getAvatarColor = (text) => {
    const colors = ['#7367F0', '#00CFE8', '#28C76F', '#FF9F43', '#EA5455', '#9966FF', '#00D4BD']
    const colorIndex = text.charCodeAt(0) % colors.length
    return colors[colorIndex]
  }
  
  return (
    <div className="position-relative me-3" style={{ width: size, height: size }}>
      {candidates.length === 0 || showCoinFallback ? (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '8px',
            backgroundColor: getAvatarColor(symbol || 'C'),
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.5,
            fontWeight: 'bold'
          }}
        >
          {(symbol || 'C').charAt(0).toUpperCase()}
        </div>
      ) : (
        <img
          src={src}
          alt={symbol}
          width={size}
          height={size}
          style={{ objectFit: 'cover', borderRadius: '8px' }}
          onError={handleCoinError}
        />
      )}
      {showNetworkBadge && (
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
          {networkCandidates.length === 0 || showNetFallback ? (
            <div
              className="rounded-circle"
              style={{
                width: badgeSize - 4,
                height: badgeSize - 4,
                backgroundColor: getAvatarColor(networkSymbol || 'N'),
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: (badgeSize - 4) * 0.6,
                fontWeight: 'bold'
              }}
            >
              {(networkSymbol || 'N').charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src={netSrc}
              alt={networkSymbol}
              width={badgeSize - 4}
              height={badgeSize - 4}
              className="rounded-circle"
              style={{ objectFit: 'cover' }}
              onError={handleNetError}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function SupportedCrypto() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [coinNetworks, setCoinNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCoin, setFilterCoin] = useState('')
  const [filterNetwork, setFilterNetwork] = useState('')
  const [coins, setCoins] = useState([])
  const [networks, setNetworks] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    loadCoinNetworks()
    loadFilterOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadFilterOptions() {
    try {
      // Load all coins for filter (get unique symbols)
      const coinsResponse = await getCoins(token, 1, 100)
      const allCoins = coinsResponse?.items || []
      const coinSymbols = [...new Set(allCoins.map(c => c.symbol).filter(Boolean))].sort()
      setCoins(coinSymbols)

      // Load all networks for filter (get unique symbols)
      const networksResponse = await getNetworks(token, 1, 100)
      const allNetworks = networksResponse?.items || []
      const networkSymbols = [...new Set(allNetworks.map(n => n.symbol).filter(Boolean))].sort()
      setNetworks(networkSymbols)
    } catch (e) {
      console.error('Failed to load filter options:', e)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoinNetworks(1, pagination.limit)
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Reload when filters change
  useEffect(() => {
    loadCoinNetworks(1, pagination.limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCoin, filterNetwork])

  async function loadCoinNetworks(page = pagination.page, limit = pagination.limit) {
    setLoading(true)
    setError('')
    try {
      const response = await getCoinNetworks(token, page, limit, searchQuery, filterCoin, filterNetwork)
      const items = response?.items || []
      const paginationData = response?.pagination || {}

      setCoinNetworks(items)
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      })
    } catch (e) {
      setError(e?.message || 'Failed to load supported crypto')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    loadCoinNetworks(newPage, pagination.limit)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-0">{t('nav.supportedCrypto', { defaultValue: 'Supported Crypto' })}</h5>
              <p className="text-muted small mb-0 mt-1">{t('crypto.manageSupportedCrypto', { defaultValue: 'Manage supported cryptocurrency networks' })}</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/admin/crypto/supported/create')}
            >
              <i className="bx bx-plus me-1"></i>
              {t('crypto.addSupported', { defaultValue: 'Add Support' })}
            </button>
          </div>

          {/* Search Bar & Filters */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bx bx-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('crypto.searchSupported', { defaultValue: 'Search by coin or network...' })}
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterCoin}
                onChange={(e) => setFilterCoin(e.target.value)}
              >
                <option value="">{t('crypto.allCoins', { defaultValue: 'All Coins' })}</option>
                {coins.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterNetwork}
                onChange={(e) => setFilterNetwork(e.target.value)}
              >
                <option value="">{t('crypto.allNetworks', { defaultValue: 'All Networks' })}</option>
                {networks.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            {(filterCoin || filterNetwork) && (
              <div className="col-md-2">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setFilterCoin('')
                    setFilterNetwork('')
                  }}
                >
                  <i className="bx bx-x me-1"></i>
                  {t('actions.reset', { defaultValue: 'Reset' })}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card-body">
            <div className="alert alert-danger mb-0" role="alert">
              <i className="bx bx-error-circle me-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{t('crypto.coinName', { defaultValue: 'Coin' })}</th>
                <th>{t('crypto.networkName', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('crypto.contractAddress', { defaultValue: 'Contract Address' })}</th>
                <th className="text-center">{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
                <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {coinNetworks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <i className="bx bx-coin-stack mb-3" style={{ fontSize: '3rem', color: '#a1acb8' }}></i>
                      <p className="text-muted mb-0">
                        {searchQuery 
                          ? t('crypto.noSupportedFound', { defaultValue: 'No supported crypto found' })
                          : t('crypto.noSupported', { defaultValue: 'No supported crypto yet' })
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                coinNetworks.map((coinNetwork) => (
                  <tr key={coinNetwork.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center">
                        <CoinImg 
                          coin={coinNetwork.coin}
                          symbol={coinNetwork.coin?.symbol}
                          networkSymbol={coinNetwork.network?.symbol}
                          size={40}
                        />
                        <div>
                          <div className="fw-medium">{coinNetwork.coin?.name || 'N/A'}</div>
                          <small className="text-muted">{coinNetwork.coin?.symbol || 'N/A'}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div>
                        <div className="fw-medium">{coinNetwork.network?.name || 'N/A'}</div>
                        {coinNetwork.network?.chainId && (
                          <small className="text-muted">Chain ID: {coinNetwork.network.chainId}</small>
                        )}
                      </div>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      {coinNetwork.contractAddress ? (
                        <code className="text-muted small">{coinNetwork.contractAddress.substring(0, 8)}...{coinNetwork.contractAddress.substring(coinNetwork.contractAddress.length - 6)}</code>
                      ) : (
                        <span className="text-muted">Native</span>
                      )}
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <span className={`badge bg-label-${
                        coinNetwork.status === 'active' ? 'success' : 
                        coinNetwork.status === 'maintenance' ? 'warning' : 
                        'secondary'
                      }`}>
                        {coinNetwork.status === 'active' 
                          ? t('admin.active', { defaultValue: 'Active' })
                          : coinNetwork.status === 'maintenance'
                          ? t('crypto.maintenance', { defaultValue: 'Maintenance' })
                          : t('crypto.inactive', { defaultValue: 'Inactive' })
                        }
                      </span>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <button
                        className="btn btn-sm btn-icon btn-label-primary"
                        onClick={() => navigate(`/admin/crypto/supported/${coinNetwork.id}`)}
                        title={t('actions.edit', { defaultValue: 'Edit' })}
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
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
                  onClick={() => handlePageChange(pagination.page - 1)}
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
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {t('actions.next', { defaultValue: 'Next' })}
                  <i className="bx bx-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
