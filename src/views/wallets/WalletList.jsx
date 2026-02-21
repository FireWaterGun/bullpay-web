import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listWallets, deleteWallet } from '../../api/wallets'
import { listCoins } from '../../api/coins'
import ConfirmModal from '../../components/ConfirmModal'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard } from '../../utils/clipboard'

const NETWORK_LABELS = { 1: 'Bitcoin', 2: 'Lightning', 10: 'Ethereum', 11: 'ERC-20', 20: 'BSC (BEP-20)', 21: 'BEP-20', 30: 'TRON (TRC-20)', 31: 'TRC-20', 40: 'Polygon', 50: 'Solana', 60: 'TON', 61: 'TON (Jetton)', 70: 'Base', 80: 'Arbitrum', 90: 'Optimism', 100: 'Avalanche C-Chain' }
function getNetworkLabel(n, coin) {
  // Align with Balance view: prefer the coin's friendly name when available
  if (coin?.name) return coin.name
  if (n?.network && typeof n.network === 'object' && n.network.name) return n.network.name
  if (typeof n?.network === 'string') return n.network
  if (n?.networkName) return n.networkName
  const id = Number(n?.networkId ?? n)
  if (!Number.isFinite(id)) return '-'
  if (NETWORK_LABELS[id]) return NETWORK_LABELS[id]
  const sym = String(coin?.symbol || coin || '').toUpperCase()
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin'
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20'
  return `Network #${n?.networkId ?? id ?? '-'}`
}

export default function WalletList({ titleKey, titleDefault, showCreate = true, createLabelKey = 'wallet.createButton', createLabelDefault = 'Withdraw wallet', createPath = '/wallet/new-address', showActions = true }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coins, setCoins] = useState([])
  const [copied, setCopied] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await listCoins(token)
        if (!mounted) return
        setCoins(Array.isArray(data) ? data : [])
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [token])

  const coinNetworkById = useMemo(() => {
    const m = new Map()
    for (const cn of coins) {
      const id = Number(cn?.id)
      if (!Number.isNaN(id)) m.set(id, cn)
    }
    return m
  }, [coins])

  const coinBySymbol = useMemo(() => {
    const m = new Map()
    for (const cn of coins) {
      const sym = (cn?.coin?.symbol || '').toUpperCase()
      if (sym && !m.has(sym)) m.set(sym, cn.coin)
    }
    return m
  }, [coins])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await listWallets(token)
        if (!mounted) return
        setItems(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!mounted) return
        setError(typeof e?.message === 'string' ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token])

  async function copyAddress(addr) {
    if (!addr) return
    const ok = await copyToClipboard(addr)
    if (ok) {
      setCopied(addr)
      setTimeout(() => setCopied(null), 1500)
    }
  }

  function requestDelete(id) {
    setPendingDeleteId(id)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    const id = pendingDeleteId
    if (!id) return
    try {
      setDeletingId(id)
      await deleteWallet(id, token)
      setItems(items => items.filter(it => String(it.id) !== String(id)))
      setConfirmOpen(false)
      setPendingDeleteId(null)
    } catch (e) {
      alert(typeof e?.message === 'string' ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const pendingItem = useMemo(() => {
    if (!pendingDeleteId) return null
    return items.find(it => String(it.id) === String(pendingDeleteId)) || null
  }, [items, pendingDeleteId])

  const pendingDisplay = useMemo(() => {
    if (!pendingItem) return { sym: '-', addr: '' }
    const cn = coinNetworkById.get(Number(pendingItem.coinNetworkId))
    const sym = (cn?.coin?.symbol || pendingItem.coinSymbol || '-').toString()
    const addr = pendingItem.address || ''
    return { sym, addr }
  }, [pendingItem, coinNetworkById])

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">{t(titleKey || 'wallet.listTitle', { defaultValue: titleDefault || 'Wallets' })}</h5>
          {showCreate && (
            <button className="btn btn-primary" onClick={() => navigate(createPath)}>
              {t(createLabelKey, { defaultValue: createLabelDefault })}
            </button>
          )}
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" aria-hidden="true"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted py-5">{t('wallet.none', { defaultValue: 'No wallets' })}</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
                    <th className="text-nowrap">{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
                    {showActions && (
                      <th className="text-end cell-fit">{t('wallet.colActions', { defaultValue: 'Actions' })}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((w, idx) => {
                    const cn = coinNetworkById.get(Number(w.coinNetworkId))
                    const coinSym = (cn?.coin?.symbol || w.coinSymbol || '-').toString()
                    const coinMeta = cn?.coin || coinBySymbol.get(coinSym.toUpperCase())
                    const addr = w.address || '-'
                    return (
                      <tr key={w.id || idx}>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg coin={coinMeta} symbol={coinSym} size={28} imgClassName="rounded me-3 align-text-bottom" />
                            <div>
                              <div className="fw-medium">
                                {coinSym}
                                <span className="badge bg-label-danger align-middle ms-2">{getNetworkLabel(cn, coinMeta)}</span>
                              </div>
                              <div className="text-muted small">{getNetworkLabel(cn, coinMeta)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ maxWidth: 520 }}>
                          <span className="font-monospace text-truncate d-inline-block align-middle" style={{ maxWidth: 420 }} title={addr}>{addr}</span>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-outline-secondary ms-2 align-middle"
                            onClick={() => copyAddress(addr)}
                            disabled={!w.address}
                            aria-label={copied === addr ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                            title={copied === addr ? t('common.copied', { defaultValue: 'Copied' }) : t('wallet.copy', { defaultValue: 'Copy' })}
                          >
                            <i className={`bx ${copied === addr ? 'bx-check text-success' : 'bx-copy'}`}></i>
                          </button>
                        </td>
                        {showActions && (
                          <td className="text-end">
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                title={t('actions.edit') || 'Edit'}
                                onClick={() => navigate(`/wallets/${w.id}/edit`)}
                              >
                                <i className="bx bx-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title={t('actions.delete') || 'Delete'}
                                onClick={() => requestDelete(w.id)}
                                disabled={deletingId === w.id}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showActions && (
        <ConfirmModal
          show={confirmOpen}
          title={t('actions.delete') || 'Delete'}
          message={(
            <>
              <div>{t('wallet.confirmDelete', { defaultValue: 'Delete this wallet?' })}</div>
              {pendingItem && (
                <div className="mt-2 small text-muted">
                  <span className="d-block text-truncate" style={{ maxWidth: 360 }} title={pendingDisplay.addr}>{pendingDisplay.addr}</span>
                </div>
              )}
            </>
          )}
          confirmText={t('actions.delete') || 'Delete'}
          cancelText={t('actions.back') || 'Back'}
          busy={!!deletingId}
          onConfirm={confirmDelete}
          onCancel={() => { if (!deletingId) { setConfirmOpen(false); setPendingDeleteId(null) } }}
          variant="basic"
        />
      )}
    </div>
  )
}
