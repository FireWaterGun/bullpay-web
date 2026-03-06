'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { listWallets, deleteWallet } from '@/lib/api/wallets'
import { useCoins } from '@/hooks/useCoins'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import ConfirmModal from '@/components/ConfirmModal'
import { addressStatusBadgeClass, formatAddressStatus } from '@/components/balance/withdrawalHelpers'
import RefreshButton from '@/components/RefreshButton'
import CardEmptyState from '@/components/CardEmptyState'
import { Card, Button, Spinner, Table } from '@/components/ui'

function ActionMenu({ wallet, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) close() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-surface-400 hover:bg-surface-100 dark:hover:bg-white/6 hover:text-surface-600 transition-colors cursor-pointer"
      >
        <i className="bx bx-dots-vertical-rounded text-lg"></i>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] py-1 bg-raised rounded-lg shadow-lg border border-surface-200">
          <button type="button" onClick={() => { onEdit(); close() }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:hover:bg-white/6 transition-colors cursor-pointer">
            <i className="bx bx-edit text-base"></i>Edit
          </button>
          <button type="button" onClick={() => { onDelete(); close() }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors cursor-pointer">
            <i className="bx bx-trash text-base"></i>Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function WalletsPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { fmtDate } = useDateFormat()

  const [wallets, setWallets] = useState([])
  const { coins } = useCoins()
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const walletList = await listWallets(token)
      setWallets(walletList || [])
    } catch (err) {
      toast.error(t('wallets.loadError', { defaultValue: 'Failed to load wallets' }))
    } finally {
      setLoading(false)
    }
  }, [token, toast, t])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-semibold text-surface-900">{t('wallets.title', { defaultValue: 'Withdrawal Addresses' })}</h4>
          <RefreshButton onClick={loadData} loading={loading} />
        </div>
        <Link
          href="/wallets/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <i className="bx bx-plus text-lg"></i>
          {t('wallets.addNew', { defaultValue: 'Add Address' })}
        </Link>
      </div>

      <Card>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : wallets.length === 0 ? (
            <div className="p-5">
              <CardEmptyState
                icon="bx-wallet"
                message={t('wallets.empty', { defaultValue: 'No withdrawal addresses found' })}
              >
                <Link
                  href="/wallets/create"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <i className="bx bx-plus"></i>
                  {t('wallets.addFirst', { defaultValue: 'Add your first address' })}
                </Link>
              </CardEmptyState>
            </div>
          ) : (
            <Table>
                <thead>
                  <tr>
                    <th>{t('wallets.label', { defaultValue: 'Label' })}</th>
                    <th>{t('wallets.coin', { defaultValue: 'Coin' })}</th>
                    <th>{t('wallets.address', { defaultValue: 'Address' })}</th>
                    <th>{t('wallets.status', { defaultValue: 'Status' })}</th>
                    <th>{t('wallets.added', { defaultValue: 'Added' })}</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id}>
                      <td className="font-medium">{w.label || '-'}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <CoinImg symbol={w.coin?.symbol} networkSymbol={w.network?.symbol} size={20} />
                          <span>{w.coin?.symbol || '-'}</span>
                          <span className="text-xs text-surface-400">({w.network?.symbol || ''})</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-surface-600 truncate inline-block max-w-[180px]">
                          {w.address || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={addressStatusBadgeClass(w.status)}>
                          {formatAddressStatus(w.status)}
                        </span>
                      </td>
                      <td className="text-xs text-surface-500">{fmtDate(w.createdAt)}</td>
                      <td>
                        <ActionMenu
                          wallet={w}
                          onEdit={() => router.push(`/wallets/${w.id}/edit`)}
                          onDelete={() => setDeleteTarget(w)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
          )}
      </Card>

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
    </>
  )
}
