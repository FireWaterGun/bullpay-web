'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { useUserInvoiceEvents } from '@/hooks/useInvoiceEvents'
import { listWithdrawals } from '@/lib/api/withdrawals'
import { listCoins } from '@/lib/api/coins'
import { listWallets } from '@/lib/api/wallets'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import WalletAddressTable from '@/components/balance/WalletAddressTable'
import {
  formatAmount,
  getNetworkLabel,
  statusBadgeClass,
  formatStatusLabel,
  WITHDRAWAL_STATUSES,
} from '@/components/balance/withdrawalHelpers'
import RefreshButton from '@/components/RefreshButton'

export default function WithdrawalsPage() {
  const { t } = useTranslation()
  const { fmtDate } = useDateFormat()
  const { token, user } = useAuth()
  const toast = useToast()

  // Wallets state
  const [walletItems, setWalletItems] = useState([])
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState('')

  // Withdrawals state
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coins, setCoins] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [status, setStatus] = useState('ALL')
  const [pagination, setPagination] = useState(null)

  // Load coins and wallets in parallel
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setWalletLoading(true)
        const [coinsData, walletsData] = await Promise.all([
          listCoins(token),
          listWallets(token),
        ])
        if (!mounted) return
        setCoins(Array.isArray(coinsData) ? coinsData : [])
        setWalletItems(Array.isArray(walletsData) ? walletsData : [])
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
      const result = await listWithdrawals({ page, limit, status: queryStatus }, token)
      setItems(Array.isArray(result.items) ? result.items : [])
      setPagination(result.pagination || null)
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
    onWithdrawalCompleted: () => loadWithdrawals(),
  })

  const cnById = useMemo(() => {
    const m = new Map()
    for (const cn of coins) {
      m.set(Number(cn.id), cn)
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
      {/* Wallet Addresses */}
      <div className="mb-4">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">{t('balance.withdrawals', { defaultValue: 'Withdrawals' })}</h5>
              <RefreshButton onClick={loadWithdrawals} loading={loading} />
            </div>
            <Link href="/wallet/new-address" className="btn btn-primary">
              {t('balance.newAddress', { defaultValue: 'New Address' })}
            </Link>
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

      {/* Withdrawal Transactions */}
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
                    <th className="text-center cell-fit">{t('actions.action', { defaultValue: 'Action' })}</th>
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
                        <td className="cell-fit">
                          <Link
                            href={`/withdrawals/${it.id}`}
                            className="font-monospace fw-semibold text-primary"
                            style={{ textDecoration: 'none' }}
                          >
                            {it.id}
                          </Link>
                        </td>
                        <td>
                          <span className="text-muted">{networkSym || sym}</span>
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
                        <td className="text-nowrap">
                          <span className={statusBadgeClass(it.status)}>{formatStatusLabel(String(it.status || '').toUpperCase())}</span>
                        </td>
                        <td className="text-nowrap text-end">
                          <span className="text-muted small">{fmtDate(it.createdAt)}</span>
                        </td>
                        <td className="text-center">
                          <Link
                            href={`/withdrawals/${it.id}`}
                            className="btn btn-sm btn-icon btn-outline-primary"
                            title={t('actions.view', { defaultValue: 'View' })}
                          >
                            <i className="bx bx-show"></i>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              {pagination && items.length > 0 && (
                t('invoices.showingEntries', {
                  start: (page - 1) * limit + 1,
                  end: Math.min(page * limit, pagination.total || items.length),
                  total: pagination.total || items.length,
                  defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                })
              )}
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => changePage(-1)}
              >
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= (pagination?.totalPages || 1)}
                onClick={() => changePage(1)}
              >
                {t('actions.next', { defaultValue: 'Next' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
