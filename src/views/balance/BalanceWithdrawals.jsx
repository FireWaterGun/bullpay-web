import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { listWithdrawals } from '../../api/withdrawals'
import { useAuth } from '../../context/AuthContext'
import { listCoins } from '../../api/coins'
import { listWallets } from '../../api/wallets'
import { listNetworks } from '../../api/networks'

function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
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
  const byAssets = names.flatMap(n => exts.map(ext => `/assets/img/coins/${n}.${ext}`))
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
        onError={() => setIdx(i => (i + 1 < candidates.length ? i + 1 : i))}
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
            onError={() => setNetIdx(i => (i + 1 < networkCandidates.length ? i + 1 : i))}
          />
        </div>
      )}
    </div>
  )
}

function getNetworkLabel(n, coin) {
  if (coin?.name) return coin.name
  if (n?.network && typeof n.network === 'object' && n.network.name) return n.network.name
  if (typeof n?.network === 'string') return n.network
  if (n?.networkName) return n.networkName
  const id = Number(n?.networkId ?? n)
  if (!Number.isFinite(id)) return '-'
  const sym = String(coin?.symbol || coin || '').toUpperCase()
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin'
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20'
  return `Network #${n?.networkId ?? id ?? '-'}`
}

export default function BalanceWithdrawals() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  // Wallets state
  const [walletItems, setWalletItems] = useState([])
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coins, setCoins] = useState([])
  const [networks, setNetworks] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState('ALL')
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [coinsData, networksData] = await Promise.all([
          listCoins(token),
          listNetworks(token)
        ])
        if (!mounted) return
        setCoins(Array.isArray(coinsData) ? coinsData : [])
        setNetworks(Array.isArray(networksData) ? networksData : [])
      } catch {/* ignore */}
    })()
    return () => { mounted = false }
  }, [token])

  // Load wallets for top section
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setWalletLoading(true)
        const data = await listWallets(token)
        if (!mounted) return
        setWalletItems(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!mounted) return
        setWalletError(typeof e?.message === 'string' ? e.message : 'Failed to load')
      } finally {
        setWalletLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const queryStatus = status === 'ALL' ? undefined : status
        const { items, pagination } = await listWithdrawals({ page, limit, status: queryStatus }, token)
        if (!mounted) return
        setItems(Array.isArray(items) ? items : [])
        setPagination(pagination || null)
      } catch (e) {
        if (!mounted) return
        setError(typeof e?.message === 'string' ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token, page, limit, status])

  const cnById = useMemo(() => {
    const networkMap = new Map(networks.map(n => [Number(n.id), n]))
    const m = new Map()
    for (const cn of coins) {
      const id = Number(cn.id)
      const network = networkMap.get(Number(cn.networkId))
      m.set(id, { ...cn, network })
    }
    return m
  }, [coins, networks])

  const [copiedMap, setCopiedMap] = useState({})
  async function copyAddress(text, key) {
    if (!text) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      }
      setCopiedMap(m => ({ ...m, [key]: true }))
      setTimeout(() => setCopiedMap(m => ({ ...m, [key]: false })), 1500)
    } catch {
      // ignore
    }
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

  const statuses = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
  function changeStatus(s) {
    setStatus(s)
    setPage(1)
  }

  function changePage(next) {
    const totalPages = Number(pagination?.totalPages || 1)
    const newPage = Math.min(Math.max(page + next, 1), totalPages)
    if (newPage !== page) setPage(newPage)
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="mb-4">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">{t('balance.withdrawals', { defaultValue: 'Withdrawals' })}</h5>
            <button className="btn btn-primary" onClick={() => navigate('/app/balance/new-address')}>
              {t('balance.newAddress', { defaultValue: 'New Address' })}
            </button>
          </div>
          <div className="card-body">
            {walletError && <div className="alert alert-danger" role="alert">{walletError}</div>}
            {walletLoading ? (
              <div className="text-center py-4"><div className="spinner-border" role="status" aria-hidden="true"></div></div>
            ) : walletItems.length === 0 ? (
              <div className="text-center text-muted py-4">{t('wallet.none', { defaultValue: 'No wallets' })}</div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
                      <th className="text-nowrap">{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletItems.map((w, idx) => {
                      const cn = cnById.get(Number(w.coinNetworkId))
                      const coinSym = (cn?.coin?.symbol || w.coinSymbol || '-').toString().toUpperCase()
                      const networkSym = (cn?.network?.symbol || '').toString().toUpperCase()
                      const networkName = cn?.network?.name || getNetworkLabel(cn, cn?.coin)
                      const addr = w.address || '-'
                      return (
                        <tr key={w.id || idx}>
                          <td>
                            <div className="d-flex align-items-center">
                              <CoinImg coin={cn?.coin} symbol={coinSym} networkSymbol={networkSym} />
                              <div>
                                <div className="fw-medium">{coinSym}</div>
                                <div className="text-muted small">{networkName}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ maxWidth: 520 }}>
                            <span className="font-monospace text-truncate d-inline-block align-middle" style={{ maxWidth: 420 }} title={addr}>{addr}</span>
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-outline-secondary ms-2 align-middle"
                              onClick={() => copyAddress(addr, w.id || idx)}
                              disabled={!w.address}
                              aria-label={copiedMap[w.id || idx] ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                              title={copiedMap[w.id || idx] ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                            >
                              <i className={`bx ${copiedMap[w.id || idx] ? 'bx-check text-success' : 'bx-copy'}`}></i>
                            </button>
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

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="card-title mb-0">{t('balance.withdrawalsList', { defaultValue: 'Withdraw transactions' })}</h5>
          <ul className="nav nav-pills flex-wrap">
            {statuses.map(s => (
              <li className="nav-item" key={s}>
                <button
                  className={`nav-link ${status === s ? 'active' : ''}`}
                  onClick={() => changeStatus(s)}
                >
                  {t(`status.${s.toLowerCase()}`, { defaultValue: s.charAt(0) + s.slice(1).toLowerCase() })}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border" role="status" aria-hidden="true"></div></div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted py-4">{t('balance.noWithdrawals', { defaultValue: 'No withdrawals' })}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '12%' }} />
                  <col />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '80px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-nowrap cell-fit">{t('common.id', { defaultValue: 'ID' })}</th>
                    <th>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
                    <th className="text-nowrap">{t('balance.amount', { defaultValue: 'Amount' })}</th>
                    <th className="text-nowrap">{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
                    <th className="text-nowrap cell-fit">{t('common.status', { defaultValue: 'Status' })}</th>
                    <th className="text-nowrap text-end cell-fit">{t('common.createdAt', { defaultValue: 'Created at' })}</th>
                    <th className="text-center cell-fit">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const cn = cnById.get(Number(it.coinNetworkId))
                    const sym = (cn?.coin?.symbol || 'COIN').toUpperCase()
                    const networkSym = (cn?.network?.symbol || '').toString().toUpperCase()
                    const networkName = cn?.network?.name || getNetworkLabel(cn, cn?.coin)
                    const key = it.id
                    return (
                      <tr key={it.id}>
            <td className="cell-fit"><span className="font-monospace">{it.id}</span></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg coin={cn?.coin} symbol={sym} networkSymbol={networkSym} />
                            <div>
                              <div className="fw-medium">{sym}</div>
                              <div className="text-muted small">{networkName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-nowrap">{Number(it.amount) || it.amount} {sym}</td>
                        <td>
                          <span className="font-monospace d-block text-truncate align-middle" title={it.toAddress}>{it.toAddress}</span>
                        </td>
                        <td className="text-nowrap"><span className={statusBadgeClass(it.status)}>{String(it.status || '').toUpperCase()}</span></td>
                        <td className="text-nowrap text-end">
                          <span className="text-muted small">{new Date(it.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="text-center">
                          {it.txHash ? (
                            <a
                              href={`${it.coinNetwork?.network?.explorerUrl || cn?.network?.explorerUrl || 'https://etherscan.io'}/tx/${it.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-icon btn-outline-primary"
                              title="View Transaction"
                            >
                              <i className="bx bx-link-external"></i>
                            </a>
                          ) : (
                            <a
                              href={`${it.coinNetwork?.network?.explorerUrl || cn?.network?.explorerUrl || 'https://etherscan.io'}/address/${it.toAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-icon btn-outline-primary"
                              title="View Address">
                              <i className="bx bx-link-external"></i>
                            </a>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            {pagination ? (
              <>
                {t('common.page', { defaultValue: 'Page' })} {pagination.page} {t('common.of', { defaultValue: 'of' })} {pagination.totalPages || 1}
              </>
            ) : null}
          </div>
          <nav aria-label="Withdrawals pagination">
            <ul className="pagination mb-0">
              <li className={`page-item ${pagination?.hasPrev === false || page <= 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => changePage(-1)} aria-label="Previous">
                  &laquo; {t('pagination.prev', { defaultValue: 'Prev' })}
                </button>
              </li>
              <li className={`page-item ${pagination?.hasNext === false || (pagination && page >= (pagination.totalPages || 1)) ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => changePage(1)} aria-label="Next">
                  {t('pagination.next', { defaultValue: 'Next' })} &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
