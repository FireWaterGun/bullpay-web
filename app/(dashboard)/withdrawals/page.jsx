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
import CardEmptyState from '@/components/CardEmptyState'

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
    <>
      {/* Wallet Addresses */}
      <div className="mb-6">
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h5 className="font-semibold text-surface-900 mb-0">{t('balance.withdrawals', { defaultValue: 'Withdrawals' })}</h5>
              <RefreshButton onClick={loadWithdrawals} loading={loading} />
            </div>
            <Link href="/wallet/new-address" className="btn btn-primary">
              <i className="bx bx-plus mr-1"></i>
              {t('balance.newAddress', { defaultValue: 'New Address' })}
            </Link>
          </div>
          <div className="p-6">
            {walletError && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{walletError}</div>}
            {walletLoading ? (
              <div className="flex justify-center py-8">
                <span className="spinner w-8 h-8 border-3"></span>
              </div>
            ) : walletItems.length === 0 ? (
              <CardEmptyState
                icon="bx-wallet"
                message={t('wallet.none', { defaultValue: 'No wallets' })}
                sub={t('wallet.noneSub', { defaultValue: 'Add a withdrawal address to get started' })}
              />
            ) : (
              <WalletAddressTable walletItems={walletItems} cnById={cnById} />
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Transactions */}
      <div className="card">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-wrap gap-2">
          <h5 className="font-semibold text-surface-900 mb-0">{t('balance.withdrawalsList', { defaultValue: 'Withdraw transactions' })}</h5>
          <div className="flex flex-wrap gap-1">
            {WITHDRAWAL_STATUSES.map(s => (
              <button
                key={s}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${ status === s ?'bg-primary-600 text-white'
                    : 'text-surface-600 hover:bg-surface-100'
                }`}
                onClick={() => changeStatus(s)}
              >
                {t(`status.${s.toLowerCase()}`, { defaultValue: formatStatusLabel(s) })}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="spinner w-8 h-8 border-3"></span>
            </div>
          ) : items.length === 0 ? (
              <CardEmptyState
                icon="bx-transfer"
                message={t('balance.noWithdrawals', { defaultValue: 'No withdrawals' })}
                sub={t('balance.noWithdrawalsSub', { defaultValue: 'Your withdrawal history will appear here' })}
              />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 text-surface-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3 text-left whitespace-nowrap font-medium">ID</th>
                    <th className="py-3 px-3 text-left font-medium">{t('wallet.colChain', { defaultValue: 'Chain' })}</th>
                    <th className="py-3 px-3 text-left font-medium" style={{ minWidth: '180px' }}>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
                    <th className="py-3 px-3 text-left whitespace-nowrap font-medium">{t('balance.amount', { defaultValue: 'Amount' })}</th>
                    <th className="py-3 px-3 text-left whitespace-nowrap font-medium">{t('balance.fee', { defaultValue: 'Fee' })}</th>
                    <th className="py-3 px-3 text-left whitespace-nowrap font-medium">{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
                    <th className="py-3 px-3 text-left whitespace-nowrap font-medium">{t('common.status', { defaultValue: 'Status' })}</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap font-medium">{t('common.createdAt', { defaultValue: 'Created at' })}</th>
                    <th className="py-3 px-3 text-center font-medium">{t('actions.action', { defaultValue: 'Action' })}</th>
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
                      <tr key={it.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                        <td className="py-3 px-3">
                          <Link
                            href={`/withdrawals/${it.id}`}
                            className="font-mono font-semibold text-primary-600 no-underline hover:underline"
                          >
                            {it.id}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-surface-500">{networkSym || sym}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <CoinImg coin={coin} symbol={sym} networkSymbol={networkSym} showFallback />
                            <div>
                              <div className="font-medium text-surface-900">{sym}</div>
                              <div className="text-surface-500 text-xs">{networkName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-surface-900">{Number(it.amount) || it.amount} {sym}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-surface-500">
                          {formatAmount(it.totalFeeRaw || it.totalFee || it.feeRaw || it.fee, it.decimals || coin?.decimals || 18, 8, true)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono block truncate max-w-[200px]" title={it.toAddress}>{it.toAddress}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={statusBadgeClass(it.status)}>{formatStatusLabel(String(it.status || '').toUpperCase())}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-right text-surface-500 text-xs">{fmtDate(it.createdAt)}</td>
                        <td className="py-3 px-3 text-center">
                          <Link
                            href={`/withdrawals/${it.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors"
                            title={t('actions.view', { defaultValue: 'View' })}
                          >
                            <i className="bx bx-show text-sm"></i>
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
          <div className="flex justify-between items-center mt-4">
            <span className="text-surface-500 text-xs">
              {pagination && items.length > 0 && (
                t('invoices.showingEntries', {
                  start: (page - 1) * limit + 1,
                  end: Math.min(page * limit, pagination.total || items.length),
                  total: pagination.total || items.length,
                  defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                })
              )}
            </span>
            <div className="flex">
              <button
                className="px-3 py-1.5 text-sm border border-surface-200 rounded-l-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                disabled={page <= 1}
                onClick={() => changePage(-1)}
              >
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button
                className="px-3 py-1.5 text-sm border border-l-0 border-surface-200 rounded-r-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                disabled={page >= (pagination?.totalPages || 1)}
                onClick={() => changePage(1)}
              >
                {t('actions.next', { defaultValue: 'Next' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
