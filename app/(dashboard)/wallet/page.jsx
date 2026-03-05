'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { listCoins } from '@/lib/api/coins'
import { getBalancesWithFiat } from '@/lib/api/balance'
import { formatCoinAmount } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import RefreshButton from '@/components/RefreshButton'
import CardEmptyState from '@/components/CardEmptyState'

const NETWORK_LABELS = {
  1: 'Bitcoin',
  2: 'Lightning',
  10: 'Ethereum',
  11: 'ERC-20',
  20: 'BSC (BEP-20)',
  21: 'BEP-20',
  30: 'TRON (TRC-20)',
  31: 'TRC-20',
  40: 'Polygon',
  50: 'Solana',
  60: 'TON',
  61: 'TON (Jetton)',
  70: 'Base',
  80: 'Arbitrum',
  90: 'Optimism',
  100: 'Avalanche C-Chain',
}

function getNetworkLabel(n, coin) {
  if (coin?.name) return coin.name
  if (n?.network && typeof n.network === 'object' && n.network.name)
    return n.network.name
  if (typeof n?.network === 'string') return n.network
  const id = Number(n?.networkId ?? n)
  if (!Number.isFinite(id)) return '-'
  if (NETWORK_LABELS[id]) return NETWORK_LABELS[id]
  const sym = String(coin?.symbol || coin || '').toUpperCase()
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin'
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20'
  return `Network #${n?.networkId ?? id ?? '-'}`
}

/* ── Inline action menu (no Bootstrap JS) ── */
function ActionMenu({ coinNetworkId, t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 hover:text-surface-700 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        title={t('actions.more', { defaultValue: 'More' })}
      >
        <i className="bx bx-dots-vertical-rounded text-base"></i>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-surface-200 shadow-lg z-50 py-1">
          <Link
            href={`/wallet/withdraw/${encodeURIComponent(String(coinNetworkId))}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors no-underline"
            onClick={() => setOpen(false)}
          >
            <i className="bx bx-export text-base"></i>
            {t('balance.withdraw', { defaultValue: 'Withdraw' })}
          </Link>
        </div>
      )}
    </div>
  )
}

export default function WalletBalancePage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [coins, setCoins] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fiat, setFiat] = useState({ amount: '0.0', currency: 'USD' })
  const [rates, setRates] = useState({})

  useEffect(() => {
    let mounted = true
    loadData(mounted)
    return () => {
      mounted = false
    }
  }, [token])

  async function loadData(mounted = true) {
      try {
        setLoading(true)
        const [coinList, balanceRes] = await Promise.all([
          listCoins(token),
          getBalancesWithFiat(token, 'USD'),
        ])
        if (!mounted) return
        setCoins(Array.isArray(coinList) ? coinList : [])
        // filter only coins that have value > 0
        const list = Array.isArray(balanceRes?.breakdown)
          ? balanceRes.breakdown
          : []
        const filtered = list.filter((b) => {
          // Support new structure: availableBalance first, then totalBalance or confirmedBalance, fallback to balance
          const a = Number(
            b?.availableBalance ||
              b?.totalBalance ||
              b?.confirmedBalance ||
              b?.balance ||
              0
          )
          return Number.isFinite(a) && a > 0
        })
        setBalances(filtered)
        if (
          balanceRes?.fiat &&
          typeof balanceRes.fiat.amount === 'string'
        ) {
          setFiat({
            amount: balanceRes.fiat.amount,
            currency: balanceRes.fiat.currency || 'USD',
          })
          setRates(balanceRes.fiat.rates || {})
        } else {
          setFiat({ amount: '0.0', currency: 'USD' })
          setRates({})
        }
      } catch (e) {
        setError(e?.message || 'Failed to load balances')
      } finally {
        setLoading(false)
      }
  }

  // Map by coinNetworkId
  const coinNetById = useMemo(() => {
    const m = new Map()
    for (const cn of coins) {
      const id = Number(cn?.id)
      if (!Number.isNaN(id)) m.set(id, cn)
    }
    return m
  }, [coins])

  return (
    <>
      {/* Hero Balance Card */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h4 className="font-semibold text-surface-900 mb-0">
            {t('balance.accountsTitle', { defaultValue: 'Balance accounts' })}
          </h4>
          <RefreshButton onClick={() => loadData()} loading={loading} />
        </div>
        <div className="p-6">
          <p className="text-surface-500 text-sm mb-2">
            {t('balance.accountsSubtitle', { defaultValue: 'Your balance from all accounts.' })}
          </p>
          <div className="text-4xl font-bold text-surface-900 tracking-tight">
            {formatCoinAmount(fiat.amount)} {fiat.currency}
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            <Link href="/invoices/create" className="btn btn-outline-primary">
              <i className="bx bx-receipt mr-1"></i>
              {t('actions.createInvoice', { defaultValue: 'Create Invoice' })}
            </Link>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-surface-100">
          <h6 className="font-semibold text-surface-900 mb-0">
            {t('balance.account', { defaultValue: 'Accounts' })}
          </h6>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="spinner w-8 h-8 border-3"></span>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
          ) : balances.length === 0 ? (
            <CardEmptyState
              icon="bx-wallet"
              message={t('balance.noBalances', { defaultValue: 'No balances to show' })}
              sub={t('balance.noBalancesSub', { defaultValue: 'Your balances will appear here once you receive payments' })}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {balances.map((b, idx) => {
                const cn = coinNetById.get(Number(b.coinNetworkId))
                const coin = b.coin || cn?.coin
                const network = b.network || cn?.network

                const coinSym = (
                  b.coin?.symbol || b.coinSymbol || coin?.symbol || ''
                ).toUpperCase()
                const networkSym = (
                  b.network?.symbol || b.networkSymbol || network?.symbol || ''
                ).toUpperCase()
                const networkName =
                  b.network?.name || b.networkName || b.networkSymbol || network?.name || getNetworkLabel(cn, coin)

                const amount = formatCoinAmount(
                  b.availableBalance || b.totalBalance || b.confirmedBalance || b.balance || 0
                )
                const amtNum =
                  Number(b.availableBalance || b.totalBalance || b.confirmedBalance || b.balance || 0) || 0

                const rate = Number((rates && rates[coinSym]) || b.priceUsd || 0) || 0
                const usdVal = Number(b.valueUsd) || amtNum * rate

                return (
                  <div
                    key={`${b.coinNetworkId}-${idx}`}
                    className="flex items-center justify-between border border-surface-200 rounded-xl py-3 px-4 hover:bg-surface-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-surface-400 font-medium text-xs min-w-[60px]">
                        {networkSym || coinSym}
                      </span>
                      <CoinImg
                        coin={coin}
                        symbol={coinSym}
                        networkSymbol={networkSym}
                      />
                      <div>
                        <div className="font-medium text-surface-900">{coinSym}</div>
                        <div className="text-surface-500 text-xs">{networkName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      {Number.isFinite(usdVal) && (
                        <span className="text-surface-400 text-sm hidden sm:block">
                          {formatCoinAmount(usdVal, 2)} USD
                        </span>
                      )}
                      <div className="text-right">
                        <span className="font-medium text-surface-900">
                          {amount} {coinSym}
                        </span>
                      </div>
                      <ActionMenu coinNetworkId={b.coinNetworkId} t={t} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
