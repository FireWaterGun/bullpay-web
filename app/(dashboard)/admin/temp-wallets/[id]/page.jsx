'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getTempWallet } from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'
import TempWalletDetailsCard from '@/components/admin/temp-wallets/TempWalletDetailsCard'
import TempWalletFlagsCard from '@/components/admin/temp-wallets/TempWalletFlagsCard'
import TempWalletTimestampsCard from '@/components/admin/temp-wallets/TempWalletTimestampsCard'
import TempWalletSweepInfoCard from '@/components/admin/temp-wallets/TempWalletSweepInfoCard'

export default function TempWalletDetail() {
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTempWallet(token, id)
      setWallet(data)
    } catch (error) {
      logger.error('Failed to load temp wallet:', error)
      toast.error(t('admin.tempWallet.loadDetailError', { defaultValue: 'Failed to load temp wallet' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadWallet()
  }, [loadWallet])

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!wallet) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">
            {t('admin.tempWallet.notFound', { defaultValue: 'Temp wallet not found' })}
          </p>
          <Button href="/admin/temp-wallets">
            {t('actions.back', { defaultValue: 'Back' })}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/temp-wallets">
              <i className="bx bx-arrow-back"></i>
              {t('admin.tempWallet.backToList', { defaultValue: 'Back to Temp Wallets' })}
            </Button>
          </div>

          {/* Header Card */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet mr-2"></i>
                    {t('admin.tempWallet.title', { defaultValue: 'Temp Wallet' })} #{wallet.id}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={getStatusBadgeClass(wallet.status, 'tempWallet')}>
                      {String(wallet.status || '').toUpperCase()}
                    </span>
                    {wallet.isExpired && (
                      <Badge color="danger" label>
                        {t('status.expired', { defaultValue: 'Expired' }).toUpperCase()}
                      </Badge>
                    )}
                    {wallet.coinSymbol && (
                      <Badge color="primary" label className="inline-flex items-center gap-1">
                        <CoinImg symbol={wallet.coinSymbol} networkSymbol={wallet.networkSymbol} size={16} />
                        {wallet.coinSymbol} · {wallet.networkSymbol}
                      </Badge>
                    )}
                    {wallet.invoiceId && (
                      <Badge color="secondary">{`${t('admin.invoiceDetail.invoice', { defaultValue: 'Invoice' })} #${wallet.invoiceId}`}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline-info" href={`/admin/temp-wallet-histories?tempWalletId=${wallet.id}`}>
                    <i className="bx bx-history mr-1"></i>
                    {t('admin.tempWallet.viewHistories', { defaultValue: 'View Histories' })}
                  </Button>
                  <RefreshButton onClick={loadWallet} loading={loading} />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            {/* Wallet Info */}
            <div className="col-span-12 md:col-span-6">
              <TempWalletDetailsCard wallet={wallet} t={t} onCopy={handleCopy} />
            </div>

            {/* Right Column */}
            <div className="col-span-12 md:col-span-6">
              <TempWalletFlagsCard wallet={wallet} t={t} />
              <TempWalletTimestampsCard wallet={wallet} t={t} />
              <TempWalletSweepInfoCard wallet={wallet} t={t} onCopy={handleCopy} />

              {/* Metadata */}
              {wallet.metadata && Object.keys(wallet.metadata).length > 0 && (
                <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0">
                      <i className="bx bx-code-alt mr-2"></i>
                      {t('admin.detail.metadata', { defaultValue: 'Metadata' })}
                    </h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0 whitespace-pre-wrap break-all text-[0.8rem] max-h-[300px] overflow-auto">
                      {JSON.stringify(wallet.metadata, null, 2)}
                    </pre>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
