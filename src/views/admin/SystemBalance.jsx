import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSystemWalletStats } from '../../api/admin.ts'
import { formatAmount } from '../../utils/format'

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

export default function SystemBalance() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    setError('')
    try {
      // Send USD currency for total balance
      const res = await getSystemWalletStats(token, 'USD')
      setStats(res)
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to load system wallet stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-6">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-danger" role="alert">
          <i className="bx bx-error-circle me-2"></i>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Stats Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <i className="bx bxs-wallet bx-lg text-primary"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Total Wallets</small>
                      <h4 className="mb-0">{stats?.totalWallets || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <i className="bx bxs-check-circle bx-lg text-success"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Active Wallets</small>
                      <h4 className="mb-0">{stats?.activeWallets || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <i className="bx bxs-hot bx-lg text-warning"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Hot Wallets</small>
                      <h4 className="mb-0">{stats?.hotWallets || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-3">
                      <i className="bx bxs-shield bx-lg text-info"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Cold Wallets</small>
                      <h4 className="mb-0">{stats?.coldWallets || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Balance Card */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                <div>
                  <h4 className="card-title mb-1 fs-3">System Balance</h4>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="display-3 fw-bold text-dark">
                {(() => {
                  // Calculate total USD from each wallet
                  const totalUSD = (stats?.balanceDetails || []).reduce((sum, wallet) => {
                    const coinSymbol = wallet.systemWallet?.coinNetwork?.coin?.symbol
                    const rate = stats.fiat?.rates?.[coinSymbol] || 0
                    const usdValue = parseFloat(wallet.totalBalance || 0) * parseFloat(rate)
                    return sum + usdValue
                  }, 0)
                  
                  return totalUSD.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                })()} {stats?.fiat?.currency || 'USD'}
              </div>
              <div className="mt-3">
                <span className="badge bg-label-primary">
                  <i className="bx bx-wallet me-1"></i>
                  {stats?.walletsWithFunds || 0} wallets with funds
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Details Table */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Wallet Details</h5>
              <span className="badge bg-label-primary">
                {stats?.balanceDetails?.length || 0} wallets
              </span>
            </div>
            <div className="card-body">
              {!stats?.balanceDetails || stats.balanceDetails.length === 0 ? (
                <div className="text-center py-6">
                  <i className="bx bx-wallet bx-lg text-muted mb-3 d-block"></i>
                  <p className="text-muted mb-0">No wallets with balance found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Coin</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th className="text-end">Amount</th>
                        <th className="text-end">Price (USD)</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.balanceDetails.map((wallet) => {
                        const coin = wallet.systemWallet?.coinNetwork?.coin
                        const coinSymbol = coin?.symbol
                        const network = wallet.systemWallet?.coinNetwork?.network
                        const networkSymbol = network?.symbol
                        const networkName = network?.name
                        const rate = stats.fiat?.rates?.[coinSymbol] || 0
                        const usdValue = parseFloat(wallet.totalBalance || 0) * parseFloat(rate)
                        
                        return (
                          <tr key={wallet.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <CoinImg coin={coin} symbol={coinSymbol} networkSymbol={networkSymbol} size={32} />
                                <div>
                                  <div className="fw-medium">{coinSymbol || 'N/A'}</div>
                                  <small className="text-muted">{networkName || 'N/A'}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {wallet.systemWallet?.walletType === 'hot' ? (
                                <span className="badge bg-label-warning">
                                  <i className="bx bx-hot me-1"></i>
                                  Hot
                                </span>
                              ) : (
                                <span className="badge bg-label-info">
                                  <i className="bx bx-shield me-1"></i>
                                  Cold
                                </span>
                              )}
                            </td>
                            <td>
                              {wallet.systemWallet?.status === 'active' ? (
                                <span className="badge bg-label-success">Active</span>
                              ) : (
                                <span className="badge bg-label-secondary">
                                  {wallet.systemWallet?.status}
                                </span>
                              )}
                            </td>
                            <td className="text-end">
                              <span className="fw-medium">
                                {parseFloat(wallet.totalBalance).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 8
                                })}
                              </span>
                            </td>
                            <td className="text-end">
                              <strong>
                                ${usdValue.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </strong>
                            </td>
                            <td className="text-center">
                              <a
                                href={`${wallet.systemWallet?.coinNetwork?.network?.explorerUrl}/address/${wallet.systemWallet?.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-icon btn-outline-primary"
                                title="View on Explorer"
                              >
                                <i className="bx bx-link-external"></i>
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
