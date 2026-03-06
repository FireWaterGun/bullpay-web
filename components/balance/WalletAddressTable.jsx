'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { getNetworkLabel, formatAddressStatus, addressStatusBadgeClass } from './withdrawalHelpers'
import Table from '@/components/ui/Table'

export default function WalletAddressTable({ walletItems, cnById }) {
  const { t } = useTranslation()
  const [copiedMap, setCopiedMap] = useState({})

  async function copyAddress(text, key) {
    if (!text) return
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedMap(m => ({ ...m, [key]: true }))
      setTimeout(() => setCopiedMap(m => ({ ...m, [key]: false })), 1500)
    }
  }

  return (
    <Table>
        <thead>
          <tr className="whitespace-nowrap">
            <th style={{ width: '12%' }}>{t('wallet.colChain', { defaultValue: 'Chain' })}</th>
            <th className="w-[22%]">{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
            <th className="w-[15%]">{t('wallet.label', { defaultValue: 'Label' })}</th>
            <th>{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
            <th style={{ width: '12%' }}>{t('common.status', { defaultValue: 'Status' })}</th>
          </tr>
        </thead>
        <tbody>
          {walletItems.map((w, idx) => {
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
                  <span className="text-surface-500">
                  </span>
                </td>
                <td>
                  <div className="flex items-center">
                    <CoinImg coin={coin} symbol={coinSym} networkSymbol={networkSym} className="mr-3" showFallback />
                    <div>
                      <div>{coinSym}</div>
                      <small className="text-surface-500">{networkName}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="truncate inline-block max-w-[200px]" title={label}>{label}</span>
                </td>
                <td>
                  <div className="flex items-start">
                    <span className="font-mono break-all">{addr}</span>
                    <button
                      type="button"
                      className="ml-2 shrink-0 inline-flex items-center justify-center w-7 h-7 rounded border border-surface-200 text-surface-500 hover:bg-surface-50 dark:hover:bg-white/6 transition-colors cursor-pointer"
                      onClick={() => copyAddress(addr, w.id || idx)}
                      disabled={!w.address}
                      aria-label={copiedMap[w.id || idx] ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                      title={copiedMap[w.id || idx] ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                    >
                      <i className={`bx ${copiedMap[w.id || idx] ?'bx-check text-success-600 dark:text-success-400' : 'bx-copy'}`}></i>
                    </button>
                  </div>
                </td>
                <td>
                  <span className={addressStatusBadgeClass(w.status)}>{formatAddressStatus(w.status, t)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
    </Table>
  )
}
