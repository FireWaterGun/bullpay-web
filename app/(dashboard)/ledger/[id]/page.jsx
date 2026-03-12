'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getMyLedgerEntry } from '@/lib/api/userLedger'
import { formatUsd } from '@/lib/utils/format'
import { formatAmount, getEntryCodeLabel, userStateBadge } from '@/components/ledger/ledgerUtils'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function MyLedgerDetail() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { id } = useParams()
  const { fmtDateTime } = useDateFormat()
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)

  const loadEntry = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getMyLedgerEntry(token, id)
      setEntry(data)
    } catch (error) {
      logger.error('Failed to load ledger entry:', error)
      toast.error(t('userLedger.loadError', { defaultValue: 'Failed to load ledger entry' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadEntry()
  }, [loadEntry])

  async function copyToClipboard(text) {
    const ok = await copyText(text)
    if (ok) {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    } else {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    }
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <i className="bx bx-error-circle text-5xl text-surface-400"></i>
        <p className="text-surface-500 mt-2">{t('userLedger.notFound', { defaultValue: 'Ledger entry not found' })}</p>
        <Button href="/ledger">{t('userLedger.backToList', { defaultValue: 'Back to Activity' })}</Button>
      </div>
    )
  }

  const isCredit = entry.entryType === 'credit'
  const isReversed = entry.state === 'reversed'

  return (
    <>
      {/* Back Button */}
      <Button variant="outline-secondary" className="mb-4 gap-2" href="/ledger">
        <i className="bx bx-arrow-back"></i>
        {t('userLedger.backToList', { defaultValue: 'Back to Activity' })}
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {entry.coinSymbol && <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={48} />}
              <div>
                <h4 className="font-semibold text-surface-900 mb-1">
                  {t('userLedger.entryDetail', { defaultValue: 'Ledger Entry' })} #{entry.id}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.entryCode && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-600 dark:bg-dark-elevated">
                      {getEntryCodeLabel(entry.entryCode, t)}
                    </span>
                  )}
                  {userStateBadge(entry.state, t)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${isReversed ? '' : isCredit ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}
              >
                {isReversed ? '' : isCredit ? '+' : '-'}
                {formatAmount(entry.amount)} <span className="text-sm font-normal">{entry.coinSymbol}</span>
              </div>
              <div className="text-surface-500">{formatUsd(entry.amountUsd)}</div>
              {entry.networkName && <small className="text-surface-500">{entry.networkName}</small>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entry Details */}
        <Card>
          <div className="px-6 py-4 border-b border-surface-200">
            <h5 className="font-semibold text-surface-900 mb-0">
              <i className="bx bx-detail mr-2"></i>
              {t('userLedger.details', { defaultValue: 'Details' })}
            </h5>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-surface-500 py-2 pr-4 w-2/5">ID</td>
                  <td className="py-2 font-medium">{entry.id}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('userLedger.coin', { defaultValue: 'Coin' })}</td>
                  <td className="py-2">
                    <div className="flex items-center">
                      <CoinImg
                        symbol={entry.coinSymbol}
                        networkSymbol={entry.networkSymbol}
                        size={24}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">{entry.coinSymbol || 'N/A'}</span>
                        {entry.networkName && <small className="text-surface-500 ml-1">/ {entry.networkName}</small>}
                      </div>
                    </div>
                  </td>
                </tr>
                {entry.entryCode && (
                  <tr>
                    <td className="text-surface-500 py-2 pr-4">
                      {t('userLedger.code', { defaultValue: 'Entry Code' })}
                    </td>
                    <td className="py-2">
                      <span className="font-medium font-mono">{entry.entryCode}</span>
                      <span className="text-surface-500 ml-2">({getEntryCodeLabel(entry.entryCode, t)})</span>
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('userLedger.state', { defaultValue: 'State' })}</td>
                  <td className="py-2">{userStateBadge(entry.state, t)}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('userLedger.amount', { defaultValue: 'Amount' })}</td>
                  <td className="py-2">
                    <span
                      className={`font-bold ${isReversed ? '' : isCredit ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}
                    >
                      {isReversed ? '' : isCredit ? '+' : '-'}
                      {formatAmount(entry.amount)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">USD</td>
                  <td className="py-2">{formatUsd(entry.amountUsd)}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">
                    {t('userLedger.usdRate', { defaultValue: 'USD Rate' })}
                  </td>
                  <td className="py-2">
                    {entry.usdRate ? formatUsd(entry.usdRate) : 'N/A'}
                    {entry.rateSource && <small className="text-surface-500 ml-1">({entry.rateSource})</small>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Transaction & Timestamps */}
        <div className="space-y-6">
          {entry.txHash && (
            <Card>
              <div className="px-6 py-4 border-b border-surface-200">
                <h5 className="font-semibold text-surface-900 mb-0">
                  <i className="bx bx-link mr-2"></i>
                  {t('userLedger.transaction', { defaultValue: 'Transaction' })}
                </h5>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="text-surface-500 py-2 pr-4 w-2/5">
                        {t('userLedger.txHash', { defaultValue: 'Tx Hash' })}
                      </td>
                      <td className="py-2">
                        <span className="font-mono break-all text-xs">{entry.txHash}</span>
                        <div className="flex gap-1 mt-2">
                          {entry.explorerUrl && (
                            <a
                              href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-primary-200 text-primary-600 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30"
                            >
                              <i className="bx bx-link-external"></i>
                              {t('userLedger.viewExplorer', { defaultValue: 'View on Explorer' })}
                            </a>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-surface-200 text-surface-600 hover:bg-surface-50 dark:hover:bg-white/6"
                            onClick={() => copyToClipboard(entry.txHash)}
                          >
                            <i className="bx bx-copy"></i>
                            {t('actions.copy', { defaultValue: 'Copy' })}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <div className="px-6 py-4 border-b border-surface-200">
              <h5 className="font-semibold text-surface-900 mb-0">
                <i className="bx bx-time mr-2"></i>
                {t('userLedger.timestamps', { defaultValue: 'Timestamps' })}
              </h5>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="text-surface-500 py-2 pr-4 w-2/5">
                      {t('userLedger.createdAt', { defaultValue: 'Created' })}
                    </td>
                    <td className="py-2">{fmtDateTime(entry.createdAt)}</td>
                  </tr>
                  {entry.committedAt && (
                    <tr>
                      <td className="text-surface-500 py-2 pr-4">
                        {t('userLedger.committedAt', { defaultValue: 'Committed' })}
                      </td>
                      <td className="py-2">{fmtDateTime(entry.committedAt)}</td>
                    </tr>
                  )}
                  {entry.settledAt && (
                    <tr>
                      <td className="text-surface-500 py-2 pr-4">
                        {t('userLedger.settledAt', { defaultValue: 'Settled' })}
                      </td>
                      <td className="py-2">{fmtDateTime(entry.settledAt)}</td>
                    </tr>
                  )}
                  {entry.reversedAt && (
                    <tr>
                      <td className="text-surface-500 py-2 pr-4">
                        {t('userLedger.reversedAt', { defaultValue: 'Reversed' })}
                      </td>
                      <td className="py-2">{fmtDateTime(entry.reversedAt)}</td>
                    </tr>
                  )}
                  {entry.updatedAt && (
                    <tr>
                      <td className="text-surface-500 py-2 pr-4">
                        {t('userLedger.updatedAt', { defaultValue: 'Updated' })}
                      </td>
                      <td className="py-2">{fmtDateTime(entry.updatedAt)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
