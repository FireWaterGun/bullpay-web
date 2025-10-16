import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getCoins } from '../../api/admin.ts'

// Coin color mapping
function getCoinColor(symbol, darker = false) {
  const colors = {
    BTC: darker ? '#E17F00' : '#F7931A',
    ETH: darker ? '#5F7AA0' : '#627EEA',
    USDT: darker ? '#1BA27A' : '#26A17B',
    USDC: darker ? '#1F7FBF' : '#2775CA',
    BNB: darker ? '#D4A000' : '#F3BA2F',
    MATIC: darker ? '#6B21A8' : '#8247E5',
    POL: darker ? '#6B21A8' : '#8247E5',
    SOL: darker ? '#8C3FD9' : '#9945FF',
    TRX: darker ? '#C91E1E' : '#FF060A',
    ADA: darker ? '#0033AD' : '#0033AD',
    DOT: darker ? '#D81B60' : '#E6007A',
  }
  return colors[symbol] || (darker ? '#6366F1' : '#818CF8')
}

export default function CoinList() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coinImages, setCoinImages] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Add version parameter to bypass Cloudflare cache
  function addVersionParam(url) {
    if (!url) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=040`
  }

  // Try to load an image URL
  function tryLoadImage(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(false)
        return
      }
      
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.crossOrigin = 'anonymous'
      img.referrerPolicy = 'no-referrer'
      img.src = url
    })
  }

  // Try to find a working image for a coin
  async function findCoinImage(coin) {
    // Try 1: External logoUrl with version param
    if (coin.logoUrl) {
      const externalUrl = addVersionParam(coin.logoUrl)
      const loaded = await tryLoadImage(externalUrl)
      if (loaded) {
        return { id: coin.id, url: externalUrl, type: 'external' }
      }
    }

    // Try 2: Local assets - try multiple extensions
    const symbol = coin.symbol.toLowerCase()
    const extensions = ['svg', 'png']
    
    for (const ext of extensions) {
      const localUrl = `/assets/img/coins/${symbol}.${ext}`
      const loaded = await tryLoadImage(localUrl)
      if (loaded) {
        return { id: coin.id, url: localUrl, type: 'local' }
      }
    }

    // Try 3: Use gradient badge (no URL)
    return { id: coin.id, url: null, type: 'gradient' }
  }

  useEffect(() => {
    loadCoins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoins(1, pagination.limit) // Reset to page 1 when searching
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  async function loadCoins(page = pagination.page, limit = pagination.limit) {
    setLoading(true)
    setError('')
    try {
      const response = await getCoins(token, page, limit, searchQuery)
      const coinList = response?.items || []
      const paginationData = response?.pagination || {}
      
      setCoins(coinList)
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      })
      
      // Find working images for all coins
      const imagePromises = coinList.map(coin => findCoinImage(coin))
      const results = await Promise.all(imagePromises)
      
      // Store image URLs by coin ID
      const imageMap = {}
      results.forEach(result => {
        imageMap[result.id] = { url: result.url, type: result.type }
      })
      setCoinImages(imageMap)
      
    } catch (e) {
      setError(e?.message || 'Failed to load coins')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    loadCoins(newPage, pagination.limit)
  }

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-6">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('invoices.loading')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-0">{t('nav.coins', { defaultValue: 'Coins' })}</h5>
              <p className="text-muted small mb-0 mt-1">{t('crypto.manageCoinsList', { defaultValue: 'Manage cryptocurrency coins' })}</p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => navigate('/app/crypto/coins/create')}
            >
              <i className="bx bx-plus me-1"></i>
              {t('actions.create', { defaultValue: 'Create' })}
            </button>
          </div>
          
          {/* Search */}
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bx bx-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('crypto.searchCoins', { defaultValue: 'Search by name or symbol...' })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bx bx-error-circle me-2"></i>
              {error}
            </div>
          )}
          
          {!error && coins.length === 0 ? (
            <div className="text-center py-6">
              <div className="mb-3">
                <i className="bx bx-search-alt text-muted" style={{ fontSize: '3rem' }}></i>
              </div>
              <h5 className="mb-2">
                {searchQuery 
                  ? t('crypto.noSearchResults', { defaultValue: 'No coins found matching your search' })
                  : t('crypto.noCoins', { defaultValue: 'No coins found' })
                }
              </h5>
              {searchQuery && (
                <p className="text-muted small mb-0">
                  {t('crypto.tryDifferentSearch', { defaultValue: 'Try a different search term' })}
                </p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover" style={{ verticalAlign: 'middle' }}>
                <thead>
                  <tr>
                    <th>{t('crypto.coinName', { defaultValue: 'Coin' })}</th>
                    <th>{t('crypto.symbol', { defaultValue: 'Symbol' })}</th>
                    <th className="text-center">{t('crypto.decimals', { defaultValue: 'Decimals' })}</th>
                    <th className="text-center">{t('invoices.statusCol')}</th>
                    <th className="text-center">{t('invoices.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin) => (
                    <tr key={coin.id}>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div className="d-flex align-items-center">
                          {coinImages[coin.id]?.url ? (
                            <img 
                              src={coinImages[coin.id].url}
                              alt={coin.symbol}
                              width="40"
                              height="40"
                              className="me-3"
                              style={{ objectFit: 'contain' }}
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div 
                              className="me-3 rounded-circle d-flex align-items-center justify-content-center fw-bold"
                              style={{
                                width: 40,
                                height: 40,
                                background: `linear-gradient(135deg, ${getCoinColor(coin.symbol)} 0%, ${getCoinColor(coin.symbol, true)} 100%)`,
                                color: 'white',
                                fontSize: '0.875rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                letterSpacing: '-0.5px'
                              }}
                              title={coin.name}
                            >
                              {coin.symbol.substring(0, 3)}
                            </div>
                          )}
                          <div>
                            <div className="fw-medium">{coin.name || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span className="fw-medium">{coin.symbol}</span>
                      </td>
                      <td className="text-center" style={{ verticalAlign: 'middle' }}>{coin.decimals || 0}</td>
                      <td className="text-center" style={{ verticalAlign: 'middle' }}>
                        {coin.status === 'active' ? (
                          <span className="badge bg-label-success">{t('admin.active')}</span>
                        ) : (
                          <span className="badge bg-label-secondary">{coin.status}</span>
                        )}
                      </td>
                      <td className="text-center" style={{ verticalAlign: 'middle' }}>
                        <button 
                          className="btn btn-sm btn-icon" 
                          title={t('actions.edit', { defaultValue: 'Edit' })}
                          onClick={() => navigate(`/app/crypto/coins/edit/${coin.id}`)}
                        >
                          <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {!error && coins.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted small">
                {t('invoices.showingEntries', {
                  start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                  end: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                  defaultValue: `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} entries`
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
          )}
        </div>
      </div>
    </div>
  )
}
