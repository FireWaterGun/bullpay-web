'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getPlatformLedgerEntry } from '@/lib/api/admin'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function PlatformLedgerDetail() {
  const { fmtDateTime } = useDateFormat()
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)

  const loadEntry = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPlatformLedgerEntry(token, parseInt(id))
      setEntry(data)
    } catch (error) {
      logger.error('Failed to load platform ledger entry:', error)
      toast.error(t('admin.platformLedger.loadError', { defaultValue: 'Failed to load platform ledger entry' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadEntry()
  }, [loadEntry])

  function formatAmount(val) {
    if (!val && val !== 0) return '0'
    let str = String(val)
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '')
    }
    return str || '0'
  }

  function stateBadge(state) {
    if (state === 'settled') {
      return (
        <Badge color="success" label>
          {t('admin.detail.settled', { defaultValue: 'Settled' })}
        </Badge>
      )
    }
    if (state === 'committed') {
      return (
        <Badge color="info" label>
          {t('admin.detail.committed', { defaultValue: 'Committed' })}
        </Badge>
      )
    }
    if (state === 'reversed') {
      return <Badge color="secondary">{t('admin.detail.reversed', { defaultValue: 'Reversed' })}</Badge>
    }
    return <span className="text-surface-500">{state || 'N/A'}</span>
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    } else {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    }
  }

  const entryCodeLabels = {
    WF: t('admin.platformLedger.code_WF', { defaultValue: 'Withdrawal Fee' }),
    FR: t('admin.platformLedger.code_FR', { defaultValue: 'Fee Refund' }),
    SG: t('admin.platformLedger.code_SG', { defaultValue: 'Sweep Gas Topup' }),
    SC: t('admin.platformLedger.code_SC', { defaultValue: 'Sweep Gas Cost' }),
    WG: t('admin.platformLedger.code_WG', { defaultValue: 'Withdrawal Gas' }),
    XI: t('admin.platformLedger.code_XI', { defaultValue: 'Internal Transfer In' }),
    XO: t('admin.platformLedger.code_XO', { defaultValue: 'Internal Transfer Out' }),
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!entry) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">
            {t('admin.platformLedger.notFound', { defaultValue: 'Platform ledger entry not found' })}
          </p>
          <Button href="/admin/platform-ledger">{t('actions.back', { defaultValue: 'Back' })}</Button>
        </div>
      </div>
    )
  }

  const isCredit = entry.entryType === 'credit'
  const isReversed = entry.state === 'reversed'

  // Parse metadata
  let metadata = {}
  try {
    metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
  } catch (e) {
    /* ignore */
  }

  const explorerUrl = entry.explorerUrl || null

  return (
    <div className="grow pb-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="outline-secondary" className="gap-1" href="/admin/platform-ledger">
          <i className="bx bx-arrow-back"></i>
          {t('admin.platformLedger.backToList', { defaultValue: 'Back to Platform Ledger' })}
        </Button>
      </div>

      {/* Header */}
      <Card className="mb-4">
        <div className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {entry.coinSymbol && <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={48} />}
              <div>
                <h4 className="mb-1">
                  {t('admin.platformLedger.detailTitle', {
                    defaultValue: 'Platform Ledger Entry #{{id}}',
                    id: entry.id,
                  })}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color={entry.accountType === 'revenue' ? 'success' : 'warning'} label>
                    {entry.accountType === 'revenue'
                      ? t('admin.detail.accountType_revenue', { defaultValue: 'Revenue' })
                      : t('admin.detail.accountType_expense', { defaultValue: 'Expense' })}
                  </Badge>
                  <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'success' : 'danger'} label>
                    <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
                    {isCredit
                      ? t('admin.detail.credit', { defaultValue: 'Credit' })
                      : t('admin.detail.debit', { defaultValue: 'Debit' })}
                  </Badge>
                  {entry.entryCode && (
                    <Badge color="secondary">{entryCodeLabels[entry.entryCode] || entry.entryCode}</Badge>
                  )}
                  {stateBadge(entry.state)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isReversed ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
                {isReversed ? '' : isCredit ? '+' : '-'}
                {formatAmount(entry.amount)} <span className="text-[0.75em] font-normal">{entry.coinSymbol}</span>
              </div>
              <div className="text-surface-500">{formatUsd(entry.amountUsd)}</div>
              {entry.networkName && <small className="text-surface-500">{entry.networkName}</small>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-x-6">
        {/* Entry Details */}
        <div className="md:col-span-6 col-span-12">
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <h5 className="mb-0">
                <i className="bx bx-detail mr-2 text-primary"></i>
                {t('admin.detail.details', { defaultValue: 'Details' })}
              </h5>
            </div>
            <div className="p-5">
              <Table responsive={false}>
                <tbody>
                  <tr>
                    <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                    <td className="font-medium">{entry.id}</td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">
                      {t('admin.detail.accountType', { defaultValue: 'Account Type' })}
                    </td>
                    <td>
                      <Badge color={entry.accountType === 'revenue' ? 'success' : 'warning'} label>
                        {entry.accountType === 'revenue'
                          ? t('admin.detail.accountType_revenue', { defaultValue: 'Revenue' })
                          : t('admin.detail.accountType_expense', { defaultValue: 'Expense' })}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                    <td>
                      <div className="flex items-center">
                        <CoinImg
                          symbol={entry.coinSymbol}
                          networkSymbol={entry.networkSymbol}
                          size={24}
                          className="mr-3"
                        />
                        <span className="font-medium">{entry.coinSymbol || '-'}</span>
                        {entry.networkName && <span className="text-surface-500 ml-1">({entry.networkName})</span>}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">{t('admin.detail.entryCode', { defaultValue: 'Entry Code' })}</td>
                    <td>
                      <span className="font-medium">{entry.entryCode || '-'}</span>
                      {entry.entryCode && entryCodeLabels[entry.entryCode] && (
                        <span className="text-surface-500 ml-1">- {entryCodeLabels[entry.entryCode]}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">{t('admin.detail.entryType', { defaultValue: 'Entry Type' })}</td>
                    <td>
                      <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'success' : 'danger'} label>
                        {isCredit
                          ? t('admin.detail.credit', { defaultValue: 'Credit' })
                          : t('admin.detail.debit', { defaultValue: 'Debit' })}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">{t('admin.detail.state', { defaultValue: 'State' })}</td>
                    <td>{stateBadge(entry.state)}</td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                    <td>
                      <span className={`font-medium ${isReversed ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
                        {isReversed ? '' : isCredit ? '+' : '-'}
                        {formatAmount(entry.amount)} {entry.coinSymbol}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">{t('admin.detail.usdValue', { defaultValue: 'USD Value' })}</td>
                    <td className="font-medium">{formatUsd(entry.amountUsd)}</td>
                  </tr>
                  <tr>
                    <td className="text-surface-500">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                    <td>{fmtDateTime(entry.createdAt)}</td>
                  </tr>
                  {entry.updatedAt && (
                    <tr>
                      <td className="text-surface-500">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                      <td>{fmtDateTime(entry.updatedAt)}</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Transaction & Metadata */}
        <div className="md:col-span-6 col-span-12">
          {entry.txHash && (
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0">
                  <i className="bx bx-link mr-2 text-primary"></i>
                  {t('admin.detail.transaction', { defaultValue: 'Transaction' })}
                </h5>
              </div>
              <div className="p-5">
                <Table responsive={false}>
                  <tbody>
                    <tr>
                      <td className="text-surface-500 w-[30%]">
                        {t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}
                      </td>
                      <td>
                        <div className="flex items-center">
                          <code className="mr-2 break-all">{entry.txHash}</code>
                          <Button
                            onClick={() => handleCopy(entry.txHash)}
                            title={t('actions.copy', { defaultValue: 'Copy' })}
                            size="icon-sm"
                            variant="text-secondary"
                          >
                            <i className="bx bx-copy"></i>
                          </Button>
                          {explorerUrl && (
                            <Button
                              variant="text-secondary"
                              size="icon-sm"
                              href={`${explorerUrl}/tx/${entry.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                            >
                              <i className="bx bx-link-external"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {metadata && Object.keys(metadata).length > 0 && (
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0">
                  <i className="bx bx-code-alt mr-2 text-primary"></i>
                  {t('admin.detail.metadata', { defaultValue: 'Metadata' })}
                </h5>
              </div>
              <div className="p-5">
                <pre className="bg-lighter p-3 rounded text-[0.85rem] max-h-[400px] overflow-auto">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
