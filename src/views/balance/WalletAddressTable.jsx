import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard } from '../../utils/clipboard'
import { getNetworkLabel, formatAddressStatus, addressStatusBadgeClass } from './withdrawalHelpers'

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
                  <span className={addressStatusBadgeClass(w.status)}>{formatAddressStatus(w.status, t)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
