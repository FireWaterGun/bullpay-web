import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { listWithdrawals } from '../../api/withdrawals'
import { useAuth } from '../../context/AuthContext'
import { listCoins } from '../../api/coins'
import { listWallets } from '../../api/wallets'
import { useUserInvoiceEvents } from '../../hooks/useInvoiceEvents'
import CoinImg from '../../components/CoinImg'
import WalletAddressTable from './WalletAddressTable'
import {
  formatAmount,
  getNetworkLabel,
  statusBadgeClass,
  formatStatusLabel,
  WITHDRAWAL_STATUSES,
} from './withdrawalHelpers'

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
    document.body.classList.remove('modal-open')
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
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
    const m = new Map()
    for (const cn of coins) {
      const id = Number(cn.id)
      m.set(id, cn)
    }
    return m
  }, [coins])

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
              <WalletAddressTable walletItems={walletItems} cnById={cnById} />
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="card-title mb-0">{t('balance.withdrawalsList', { defaultValue: 'Withdraw transactions' })}</h5>
          <ul className="nav nav-pills flex-wrap">
            {WITHDRAWAL_STATUSES.map(s => (
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
                    const coin = it.coin || it.coinNetwork?.coin || cnById.get(Number(it.coinNetworkId))?.coin
                    const network = it.network || it.coinNetwork?.network || cnById.get(Number(it.coinNetworkId))?.network
                    const sym = (coin?.symbol || 'COIN').toUpperCase()
                    const networkSym = (network?.symbol || '').toString().toUpperCase()
                    const networkName = network?.name || getNetworkLabel({ network }, coin)
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
