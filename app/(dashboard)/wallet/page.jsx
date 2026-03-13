'use client'

import { useState, useMemo, useRef } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import useApi from '@/hooks/useApi'
import { useCoins } from '@/hooks/useCoins'
import { getBalancesWithFiat } from '@/lib/api/balance'
import { formatCoinAmount } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import RefreshButton from '@/components/RefreshButton'
import CardEmptyState from '@/components/CardEmptyState'
import { getNetworkLabel } from '@/components/balance/withdrawalHelpers'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

/* ── Inline action menu ── */
function ActionMenu({ coinNetworkId, t }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useClickOutside(ref, () => setOpen(false), open)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 dark:hover:bg-white/6 hover:text-surface-700 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        title={t('actions.more', { defaultValue: 'More' })}
      >
        <i className="bx bx-dots-vertical-rounded text-base"></i>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-raised rounded-xl border border-surface-200 shadow-lg z-50 py-1">
          <Link
            href={`/wallet/withdraw/${encodeURIComponent(String(coinNetworkId))}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:hover:bg-white/6 transition-colors no-underline"
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
  const { coins } = useCoins()

  const { data, error, isLoading, isValidating, mutate } = useApi(
    'my-balances',
    (token) => getBalancesWithFiat(token, 'USD'),
    { onError: () => {} }
  )

  const balances = useMemo(() => {
    const list = Array.isArray(data?.breakdown) ? data.breakdown : []
    return list.filter((b) => {
      const a = Number(b?.availableBalance || b?.totalBalance || b?.confirmedBalance || b?.balance || 0)
      const u = Number(b?.unconfirmedBalance || b?.pending || 0)
      return (Number.isFinite(a) && a > 0) || (Number.isFinite(u) && u > 0)
    })
  }, [data])

  const fiat = data?.fiat && typeof data.fiat.amount === 'string'
    ? { amount: data.fiat.amount, currency: data.fiat.currency || 'USD' }
    : { amount: '0.0', currency: 'USD' }
  const pendingFiat = data?.fiat?.pendingAmount || '0'
  const rates = data?.fiat?.rates || {}

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
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
          <h4 className="font-semibold text-surface-900 mb-0">
            {t('balance.accountsTitle', { defaultValue: 'Balance accounts' })}
          </h4>
          <RefreshButton onClick={() => mutate()} loading={isValidating} />
        </div>
        <div className="p-6">
          <p className="text-surface-500 text-sm mb-2">
            {t('balance.accountsSubtitle', { defaultValue: 'Your balance from all accounts.' })}
          </p>
          <div className="text-4xl font-bold text-surface-900 tracking-tight">
            {formatCoinAmount(fiat.amount)} {fiat.currency}
          </div>
          {Number(pendingFiat) > 0 && (
            <div className="text-info-500 text-sm mt-1">
              +{formatCoinAmount(pendingFiat)} {fiat.currency} {t('balance.pending', { defaultValue: 'Pending' })}
            </div>
          )}
          <div className="flex gap-2 flex-wrap mt-4">
            <Button variant="outline-primary" href="/invoices/create">
              <i className="bx bx-receipt mr-1"></i>
              {t('actions.createInvoice', { defaultValue: 'Create Invoice' })}
            </Button>
          </div>
        </div>
      </Card>

      {/* Accounts List */}
      <Card>
        <div className="px-6 py-4 border-b border-surface-200">
          <h6 className="font-semibold text-surface-900 mb-0">{t('balance.account', { defaultValue: 'Accounts' })}</h6>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 px-4 py-3 text-sm">
              {error?.message || 'Failed to load balances'}
            </div>
          ) : balances.length === 0 ? (
            <CardEmptyState
              icon="bx-wallet"
              message={t('balance.noBalances', { defaultValue: 'No balances to show' })}
              sub={t('balance.noBalancesSub', {
                defaultValue: 'Your balances will appear here once you receive payments',
              })}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {balances.map((b, idx) => {
                const cn = coinNetById.get(Number(b.coinNetworkId))
                const coin = b.coin || cn?.coin
                const network = b.network || cn?.network

                const coinSym = (b.coin?.symbol || b.coinSymbol || coin?.symbol || '').toUpperCase()
                const networkSym = (b.network?.symbol || b.networkSymbol || network?.symbol || '').toUpperCase()
                const networkName =
                  b.network?.name || b.networkName || b.networkSymbol || network?.name || getNetworkLabel(cn, coin)

                const amount = formatCoinAmount(
                  b.availableBalance || b.totalBalance || b.confirmedBalance || b.balance || 0
                )
                const pending = Number(b.unconfirmedBalance || b.pending || 0)
                const amtNum = Number(b.availableBalance || b.totalBalance || b.confirmedBalance || b.balance || 0) || 0

                const rate = Number((rates && rates[coinSym]) || b.priceUsd || 0) || 0
                const usdVal = Number(b.valueUsd) || amtNum * rate

                return (
                  <div
                    key={`${b.coinNetworkId}-${idx}`}
                    className="flex items-center justify-between border border-surface-200 rounded-xl py-3 px-4 hover:bg-surface-50 dark:hover:bg-white/4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-surface-400 font-medium text-xs min-w-[60px]">{networkSym || coinSym}</span>
                      <CoinImg coin={coin} symbol={coinSym} networkSymbol={networkSym} />

                      <div>
                        <div className="font-medium text-surface-900">{coinSym}</div>
                        <div className="text-surface-500 text-xs">{networkName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                      {Number.isFinite(usdVal) && (
                        <span className="text-surface-400 text-sm hidden sm:block">
                          {formatCoinAmount(usdVal, 2)} USD
                        </span>
                      )}
                      <div className="text-right">
                        <span className="font-medium text-surface-900">
                          {amount} {coinSym}
                        </span>
                        {pending > 0 && (
                          <div className="text-info-500 text-xs">
                            +{formatCoinAmount(pending)} {t('balance.pending', { defaultValue: 'Pending' })}
                          </div>
                        )}
                      </div>
                      <ActionMenu coinNetworkId={b.coinNetworkId} t={t} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
