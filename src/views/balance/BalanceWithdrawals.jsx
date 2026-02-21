import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { listWithdrawals } from '../../api/withdrawals'
import { useAuth } from '../../context/AuthContext'
import { listCoins } from '../../api/coins'
import { listWallets } from '../../api/wallets'
import { AmountNormalizer } from '../../utils/amount_normalizer'
import { formatCoinAmount } from '../../utils/format'
import { copyToClipboard } from '../../utils/clipboard'
import { useUserInvoiceEvents } from '../../hooks/useInvoiceEvents'
import CoinImg from '../../components/CoinImg'

function formatAmount(amountRaw, decimals = 18) {
  if (!amountRaw) return '0'
  try {
    const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
    return formatCoinAmount(value)
  } catch (e) {
    return amountRaw.toString()
  }
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
  const { token, user } = useAuth()
  const navigate = useNavigate()
  // Wallets state
  const [walletItems, setWalletItems] = useState([])
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coins, setCoins] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState('ALL')
  const [pagination, setPagination] = useState(null)

  // Clean up any leftover modal styles on mount
  useEffect(() => {
    // Remove any leftover modal-related classes and styles
    document.body.classList.remove('modal-open')
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    
    // Remove any leftover backdrop elements
    const backdrops = document.querySelectorAll('.modal-backdrop')
    backdrops.forEach(backdrop => backdrop.remove())
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const coinsData = await listCoins(token)
        if (!mounted) return
        setCoins(Array.isArray(coinsData) ? coinsData : [])
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

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true)
      const queryStatus = status === 'ALL' ? undefined : status.toLowerCase()
      const { items, pagination } = await listWithdrawals({ page, limit, status: queryStatus }, token)
      setItems(Array.isArray(items) ? items : [])
      setPagination(pagination || null)
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, page, limit, status])

  useEffect(() => {
    loadWithdrawals()
  }, [loadWithdrawals])

  // Subscribe to Pusher events for real-time withdrawal updates
  const userIdentifier = user?.id || user?.userId || user?.email
  useUserInvoiceEvents(userIdentifier, {
    onWithdrawalCompleted: () => {
      loadWithdrawals()
    }
  })

  const cnById = useMemo(() => {
    // Fallback map for backward compatibility when coin/network objects are not embedded
    // Modern API responses include coin and network objects directly in items
    const m = new Map()
    for (const cn of coins) {
      const id = Number(cn.id)
      m.set(id, cn)
    }
    return m
  }, [coins])

  const [copiedMap, setCopiedMap] = useState({})
  async function copyAddress(text, key) {
    if (!text) return
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedMap(m => ({ ...m, [key]: true }))
      setTimeout(() => setCopiedMap(m => ({ ...m, [key]: false })), 1500)
    }
  }

  function formatAddressStatus(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'pending_verification') return t('wallet.status.pendingVerification', { defaultValue: 'Pending Verification' })
    if (v === 'active') return t('wallet.status.active', { defaultValue: 'Active' })
    if (v === 'suspended') return t('wallet.status.suspended', { defaultValue: 'Suspended' })
    if (v === 'deleted') return t('wallet.status.deleted', { defaultValue: 'Deleted' })
    return v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  function addressStatusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'pending_verification') return 'badge bg-label-warning'
    if (v === 'active') return 'badge bg-label-success'
    if (v === 'suspended') return 'badge bg-label-danger'
    if (v === 'deleted') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'WAITING_FOR_GAS') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  const statuses = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
  
  function formatStatusLabel(s) {
    // Convert WAITING_FOR_GAS to "Waiting for gas"
    return s.split('_').map((word, idx) => 
      idx === 0 ? word.charAt(0) + word.slice(1).toLowerCase() : word.toLowerCase()
    ).join(' ')
  }
  
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
            <button className="btn btn-primary" onClick={() => navigate('/wallet/new-address')}>
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
                      <th style={{ width: '12%' }}>{t('wallet.colChain', { defaultValue: 'Chain' })}</th>
                      <th style={{ width: '22%' }}>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
                      <th style={{ width: '15%' }}>{t('wallet.label', { defaultValue: 'Label' })}</th>
                      <th className="text-nowrap">{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
                      <th style={{ width: '12%' }} className="text-nowrap">{t('common.status', { defaultValue: 'Status' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletItems.map((w, idx) => {
                      // Support new structure: wallet has coin and network objects directly
                      const coin = w.coin || cnById.get(Number(w.coinNetworkId))?.coin
                      const network = w.network || cnById.get(Number(w.coinNetworkId))?.network
                      const coinSym = (coin?.symbol || w.coinSymbol || '-').toString().toUpperCase()
                      const networkSym = (network?.symbol || '').toString().toUpperCase()
                      const networkName = network?.name || getNetworkLabel({ network }, coin)
                      const addr = w.address || '-'
                      const label = w.label || '-'
                      return (
                        <tr key={w.id || idx}>
                          <td>
                            <span className="text-muted">
                              {networkSym || coinSym}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <CoinImg coin={coin} symbol={coinSym} networkSymbol={networkSym} className="me-3" showFallback />
                              <div>
                                <div>{coinSym}</div>
                                <small className="text-muted">{networkName}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: 200 }} title={label}>{label}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-start">
                              <span className="font-monospace" style={{ wordBreak: 'break-all' }}>{addr}</span>
                              <button
                                type="button"
                                className="btn btn-icon btn-sm btn-outline-secondary ms-2 flex-shrink-0"
                                onClick={() => copyAddress(addr, w.id || idx)}
                                disabled={!w.address}
                                aria-label={copiedMap[w.id || idx] ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                                title={copiedMap[w.id || idx] ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                              >
                                <i className={`bx ${copiedMap[w.id || idx] ? 'bx-check text-success' : 'bx-copy'}`}></i>
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className={addressStatusBadgeClass(w.status)}>{formatAddressStatus(w.status)}</span>
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
                  {t(`status.${s.toLowerCase()}`, { defaultValue: formatStatusLabel(s) })}
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
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '80px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-nowrap cell-fit">{t('common.id', { defaultValue: 'ID' })}</th>
                    <th>{t('wallet.colChain', { defaultValue: 'Chain' })}</th>
                    <th style={{ minWidth: '180px' }}>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
                    <th className="text-nowrap">{t('balance.amount', { defaultValue: 'Amount' })}</th>
                    <th className="text-nowrap">{t('balance.fee', { defaultValue: 'Fee' })}</th>
                    <th className="text-nowrap">{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
                    <th className="text-nowrap cell-fit">{t('common.status', { defaultValue: 'Status' })}</th>
                    <th className="text-nowrap text-end cell-fit">{t('common.createdAt', { defaultValue: 'Created at' })}</th>
                    <th className="text-center cell-fit">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    // Support new structure: withdrawal may have coin and network objects directly
                    const coin = it.coin || it.coinNetwork?.coin || cnById.get(Number(it.coinNetworkId))?.coin
                    const network = it.network || it.coinNetwork?.network || cnById.get(Number(it.coinNetworkId))?.network
                    const sym = (coin?.symbol || 'COIN').toUpperCase()
                    const networkSym = (network?.symbol || '').toString().toUpperCase()
                    const networkName = network?.name || getNetworkLabel({ network }, coin)
                    const key = it.id
                    return (
                      <tr key={it.id}>
            <td className="cell-fit"><a href={`/wallet/withdrawals/${it.id}`} onClick={(e) => { e.preventDefault(); navigate(`/wallet/withdrawals/${it.id}`) }} className="font-monospace fw-semibold text-primary" style={{ cursor: 'pointer', textDecoration: 'none' }}>{it.id}</a></td>
                        <td>
                          <span className="text-muted">
                            {networkSym || sym}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg coin={coin} symbol={sym} networkSymbol={networkSym} className="me-3" showFallback />
                            <div>
                              <div>{sym}</div>
                              <small className="text-muted">{networkName}</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-nowrap">{Number(it.amount) || it.amount} {sym}</td>
                        <td className="text-nowrap">
                          <span className="text-muted">
                            {formatAmount(it.totalFeeRaw || it.totalFee || it.feeRaw || it.fee, it.decimals || coin?.decimals || 18, 8, true)}
                          </span>
                        </td>
                        <td>
                          <span className="font-monospace d-block text-truncate align-middle" title={it.toAddress}>{it.toAddress}</span>
                        </td>
                        <td className="text-nowrap"><span className={statusBadgeClass(it.status)}>{formatStatusLabel(String(it.status || '').toUpperCase())}</span></td>
                        <td className="text-nowrap text-end">
                          <span className="text-muted small">{new Date(it.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-icon btn-outline-primary"
                            onClick={() => navigate(`/wallet/withdrawals/${it.id}`)}
                            title={t('actions.view', { defaultValue: 'View' })}
                          >
                            <i className="bx bx-show"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Simple pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              {pagination && items.length > 0 ? (
                <>
                  {t('invoices.showingEntries', {
                    start: (page - 1) * limit + 1,
                    end: Math.min(page * limit, pagination.total || items.length),
                    total: pagination.total || items.length,
                    defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                  })}
                </>
              ) : null}
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => changePage(-1)}
              >
                {t('actions.prev')}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= (pagination?.totalPages || 1)}
                onClick={() => changePage(1)}
              >
                {t('actions.next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
