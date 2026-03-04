'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { listWallets, deleteWallet } from '@/lib/api/wallets'
import { listCoins } from '@/lib/api/coins'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import ConfirmModal from '@/components/ConfirmModal'
import { addressStatusBadgeClass, formatAddressStatus } from '@/components/balance/withdrawalHelpers'
import RefreshButton from '@/components/RefreshButton'
import CardEmptyState from '@/components/CardEmptyState'

export default function WalletsPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { fmtDate } = useDateFormat()

  const [wallets, setWallets] = useState([])
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [walletList, coinList] = await Promise.all([
        listWallets(token),
        listCoins(token),
      ])
      setWallets(walletList || [])
      setCoins(coinList || [])
    } catch (err) {
      toast.error(t('wallets.loadError', { defaultValue: 'Failed to load wallets' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteWallet(deleteTarget.id, token)
      toast.success(t('wallets.deleteSuccess', { defaultValue: 'Wallet deleted successfully' }))
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error(err?.message || t('wallets.deleteError', { defaultValue: 'Failed to delete wallet' }))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <h4 className="fw-bold mb-0">{t('wallets.title', { defaultValue: 'Withdrawal Addresses' })}</h4>
          <RefreshButton onClick={loadData} loading={loading} />
        </div>
        <Link href="/wallets/create" className="btn btn-primary">
          <i className="bx bx-plus me-1"></i>
          {t('wallets.addNew', { defaultValue: 'Add Address' })}
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : wallets.length === 0 ? (
            <CardEmptyState
              icon="bx-wallet"
              message={t('wallets.empty', { defaultValue: 'No withdrawal addresses found' })}
            >
              <Link href="/wallets/create" className="btn btn-primary btn-sm mt-3">
                <i className="bx bx-plus me-1"></i>
                {t('wallets.addFirst', { defaultValue: 'Add your first address' })}
              </Link>
            </CardEmptyState>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>{t('wallets.label', { defaultValue: 'Label' })}</th>
                    <th>{t('wallets.coin', { defaultValue: 'Coin' })}</th>
                    <th>{t('wallets.address', { defaultValue: 'Address' })}</th>
                    <th>{t('wallets.status', { defaultValue: 'Status' })}</th>
                    <th>{t('wallets.added', { defaultValue: 'Added' })}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id}>
                      <td className="fw-semibold">{w.label || '-'}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <CoinImg symbol={w.coin?.symbol} networkSymbol={w.network?.symbol} size={20} />
                          <span>{w.coin?.symbol || '-'}</span>
                          <small className="text-muted">({w.network?.symbol || ''})</small>
                        </div>
                      </td>
                      <td>
                        <span className="font-monospace small text-truncate d-inline-block" style={{ maxWidth: 180 }}>
                          {w.address || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={addressStatusBadgeClass(w.status)}>
                          {formatAddressStatus(w.status)}
                        </span>
                      </td>
                      <td><span className="small">{fmtDate(w.createdAt)}</span></td>
                      <td>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-icon btn-text-secondary" data-bs-toggle="dropdown">
                            <i className="bx bx-dots-vertical-rounded"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <Link href={`/wallets/${w.id}/edit`} className="dropdown-item">
                                <i className="bx bx-edit me-2"></i>{t('wallets.edit', { defaultValue: 'Edit' })}
                              </Link>
                            </li>
                            <li>
                              <button className="dropdown-item text-danger" onClick={() => setDeleteTarget(w)}>
                                <i className="bx bx-trash me-2"></i>{t('wallets.delete', { defaultValue: 'Delete' })}
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmModal
          show
          title={t('wallets.deleteTitle', { defaultValue: 'Delete Address' })}
          message={t('wallets.deleteConfirm', { defaultValue: 'Are you sure you want to delete this withdrawal address?' })}
          confirmText={t('wallets.delete', { defaultValue: 'Delete' })}
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
