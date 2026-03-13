'use client'

import { useParams } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getSystemLedgerEntry } from '@/lib/api/admin'
import { formatUsd } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import {
  formatAmount,
  stateBadge,
  entryCodeLabels,
  getSystemEntryCodeLabel,
  getPurposeLabel,
  parseMetadata,
} from '@/components/ledger/ledgerUtils'
import { TransactionCard, TimestampsCard, MetadataCard } from '@/components/ledger/SystemLedgerDetailCards'
import PageSpinner from '@/components/PageSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function SystemLedgerDetail() {
  const { t } = useAdminTranslation()
  const toast = useToast()
  const { id } = useParams()

  const { data: entry, isLoading: loading } = useApi(
    id ? `system-ledger-${id}` : null,
    (token) => getSystemLedgerEntry(token, parseInt(id)),
    { onError: () => toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entry' })) }
  )

  async function handleCopy(text) {
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
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">
            {t('admin.ledger.notFound', { defaultValue: 'Ledger entry not found' })}
          </p>
          <Button href="/admin/system-ledger">{t('actions.back', { defaultValue: 'Back' })}</Button>
        </div>
      </div>
    )
  }

  const isCredit = entry.entryType === 'credit'
  const isReversed = entry.state === 'reversed'
  const metadata = parseMetadata(entry)
  const purposeLabel = getPurposeLabel(metadata, t)
  const explorerUrl = entry.explorerUrl || null

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/system-ledger">
              <i className="bx bx-arrow-back"></i>
              {t('admin.systemLedger.backToList', { defaultValue: 'Back to System Ledger' })}
            </Button>
          </div>

          {/* Header */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {entry.coinSymbol && (
                    <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={48} />
                  )}
                  <div>
                    <h4 className="mb-1">
                      {t('admin.systemLedger.detailTitle', {
                        defaultValue: 'System Ledger Entry #{{id}}',
                        id: entry.id,
                      })}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'danger' : 'success'} label>
                        <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} mr-1`}></i>
                        {isCredit
                          ? t('admin.detail.credit', { defaultValue: 'Credit' })
                          : t('admin.detail.debit', { defaultValue: 'Debit' })}
                      </Badge>
                      {entry.entryCode && (
                        <Badge color="secondary">{getSystemEntryCodeLabel(entry.entryCode, t)}</Badge>
                      )}
                      {stateBadge(entry.state, t)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isReversed ? '' : isCredit ? 'text-danger' : 'text-success'}`}>
                    {isReversed ? '' : isCredit ? '-' : '+'}
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
            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-detail mr-2"></i>
                    {t('admin.ledger.details', { defaultValue: 'Details' })}
                  </h5>
                </div>
                <div className="p-5">
                  <Table>
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{entry.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.walletId', { defaultValue: 'Wallet ID' })}
                        </td>
                        <td>{entry.walletId || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.ledger.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="flex items-center">
                            <CoinImg
                              symbol={entry.coinSymbol}
                              networkSymbol={entry.networkSymbol}
                              size={24}
                              className="mr-3"
                            />
                            <div>
                              <span className="font-medium">{entry.coinSymbol || 'N/A'}</span>
                              {entry.networkName && (
                                <small className="text-surface-500 ml-1">/ {entry.networkName}</small>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.ledger.entryType', { defaultValue: 'Entry Type' })}
                        </td>
                        <td>
                          <Badge
                            color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'danger' : 'success'}
                            label
                          >
                            {isCredit
                              ? t('admin.detail.credit', { defaultValue: 'Credit' })
                              : t('admin.detail.debit', { defaultValue: 'Debit' })}
                          </Badge>
                        </td>
                      </tr>
                      {entry.entryCode && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.detail.entryCode', { defaultValue: 'Entry Code' })}
                          </td>
                          <td>
                            <code>{entry.entryCode}</code>
                            <span className="text-surface-500 ml-2">
                              ({getSystemEntryCodeLabel(entry.entryCode, t)})
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-surface-500">{t('admin.ledger.state', { defaultValue: 'State' })}</td>
                        <td>{stateBadge(entry.state, t)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className={`font-bold ${isReversed ? '' : isCredit ? 'text-danger' : 'text-success'}`}>
                            {isReversed ? '' : isCredit ? '-' : '+'}
                            {formatAmount(entry.amount)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.amountRaw', { defaultValue: 'Amount (Raw)' })}
                        </td>
                        <td>
                          <code className="text-[0.8rem]">{entry.amountRaw || 'N/A'}</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.usdValue', { defaultValue: 'USD Value' })}
                        </td>
                        <td>{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.usdRate', { defaultValue: 'USD Rate' })}</td>
                        <td>
                          {entry.usdRate ? formatUsd(entry.usdRate) : 'N/A'}
                          {entry.rateSource && <small className="text-surface-500 ml-1">({entry.rateSource})</small>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.decimals', { defaultValue: 'Decimals' })}</td>
                        <td>{entry.decimals ?? 'N/A'}</td>
                      </tr>
                      {purposeLabel && (
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.purpose', { defaultValue: 'Purpose' })}</td>
                          <td className="font-medium">{purposeLabel}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Transaction, Timestamps & Metadata */}
            <div className="col-span-12 md:col-span-6">
              <TransactionCard entry={entry} metadata={metadata} explorerUrl={explorerUrl} onCopy={handleCopy} />
              <TimestampsCard entry={entry} />
              <MetadataCard metadata={metadata} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
