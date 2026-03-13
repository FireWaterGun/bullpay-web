'use client'

import { useParams } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getUserLedgerEntry } from '@/lib/api/admin'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import PageSpinner from '@/components/PageSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function UserLedgerDetail() {
  const { fmtDateTime } = useDateFormat()
  const { t } = useAdminTranslation()
  const toast = useToast()
  const { id } = useParams()

  const { data: entry, isLoading: loading } = useApi(
    id ? `user-ledger-${id}` : null,
    (token) => getUserLedgerEntry(token, parseInt(id)),
    { onError: () => toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entry' })) }
  )

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
          Settled
        </Badge>
      )
    }
    if (state === 'committed') {
      return (
        <Badge color="info" label>
          Committed
        </Badge>
      )
    }
    if (state === 'pending') {
      return (
        <Badge color="warning" label>
          {t('status.pending', { defaultValue: 'Pending' })}
        </Badge>
      )
    }
    if (state === 'reversed') return <Badge color="secondary">Reversed</Badge>
    return <span className="text-surface-500">{state || 'N/A'}</span>
  }

  const { copiedId, handleCopy } = useCopyFeedback()

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
          <Button href="/admin/user-ledger">{t('actions.back', { defaultValue: 'Back' })}</Button>
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

  const entryCodeLabels = {
    SP: 'Settlement Payment',
    SC: 'Sweep Cost',
    SG: 'Sweep Gas',
    WD: 'Withdrawal',
    DP: 'Deposit',
    FE: 'Fee',
    AJ: 'Adjustment',
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/user-ledger">
              <i className="bx bx-arrow-back"></i>
              {t('admin.ledger.backToList', { defaultValue: 'Back to User Ledger' })}
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
                      {t('admin.ledger.userLedgerEntry', { defaultValue: 'User Ledger Entry' })} #{entry.id}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'success' : 'danger'} label>
                        <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
                        {isCredit ? 'Credit' : 'Debit'}
                      </Badge>
                      {entry.entryCode && (
                        <Badge color="secondary">{entryCodeLabels[entry.entryCode] || entry.entryCode}</Badge>
                      )}
                      {stateBadge(entry.state)}
                      {entry.userId && (
                        <Badge color="primary" label>
                          <i className="bx bx-user mr-1"></i>
                          User #{entry.userId}
                        </Badge>
                      )}
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
                        <td className="text-surface-500">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td>
                          <Badge color="primary" label>
                            #{entry.userId}
                          </Badge>
                        </td>
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
                            color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'success' : 'danger'}
                            label
                          >
                            {isCredit ? 'Credit' : 'Debit'}
                          </Badge>
                        </td>
                      </tr>
                      {entry.entryCode && (
                        <tr>
                          <td className="text-surface-500">Entry Code</td>
                          <td>
                            <code>{entry.entryCode}</code>
                            <span className="text-surface-500 ml-2">
                              ({entryCodeLabels[entry.entryCode] || entry.entryCode})
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-surface-500">{t('admin.ledger.state', { defaultValue: 'State' })}</td>
                        <td>{stateBadge(entry.state)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className={`font-bold ${isReversed ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
                            {isReversed ? '' : isCredit ? '+' : '-'}
                            {formatAmount(entry.amount)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Amount (Raw)</td>
                        <td>
                          <code className="text-[0.8rem] break-all">{entry.amountRaw || 'N/A'}</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">USD Value</td>
                        <td>{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">USD Rate</td>
                        <td>
                          {entry.usdRate ? formatUsd(entry.usdRate) : 'N/A'}
                          {entry.rateSource && <small className="text-surface-500 ml-1">({entry.rateSource})</small>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Decimals</td>
                        <td>{entry.decimals ?? 'N/A'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Transaction & Timestamps */}
            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-link mr-2"></i>
                    Transaction
                  </h5>
                </div>
                <div className="p-5">
                  <Table>
                    <tbody>
                      {entry.reservationId && (
                        <tr>
                          <td className="text-surface-500 w-2/5">
                            {t('admin.detail.reservationId', { defaultValue: 'Reservation ID' })}
                          </td>
                          <td>
                            <code>{entry.reservationId}</code>
                          </td>
                        </tr>
                      )}
                      {entry.relatedId && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.detail.relatedId', { defaultValue: 'Related ID' })}
                          </td>
                          <td>#{entry.relatedId}</td>
                        </tr>
                      )}
                      {entry.txHash && (
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
                          <td>
                            <code className="break-words text-xs">{entry.txHash}</code>
                            <div className="flex gap-1 mt-2">
                              {entry.explorerUrl && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="py-[0.2rem] px-[0.5rem] text-xs"
                                  href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <i className="bx bx-link-external mr-1"></i>View on Explorer
                                </Button>
                              )}
                              <Button
                                onClick={() => handleCopy(entry.txHash, 'tx-uledger')}
                                variant="outline-secondary"
                                size="sm"
                                className="py-[0.2rem] px-[0.5rem] text-xs"
                              >
                                <i className={`bx ${copiedId === 'tx-uledger' ? 'bx-check text-success' : 'bx-copy'} mr-1`}></i>Copy
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>

              {/* Timestamps */}
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-time mr-2"></i>
                    Timestamps
                  </h5>
                </div>
                <div className="p-5">
                  <Table>
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">
                          {t('admin.detail.created', { defaultValue: 'Created' })}
                        </td>
                        <td>{fmtDateTime(entry.createdAt)}</td>
                      </tr>
                      {entry.committedAt && (
                        <tr>
                          <td className="text-surface-500">Committed</td>
                          <td>{fmtDateTime(entry.committedAt)}</td>
                        </tr>
                      )}
                      {entry.settledAt && (
                        <tr>
                          <td className="text-surface-500">Settled</td>
                          <td>{fmtDateTime(entry.settledAt)}</td>
                        </tr>
                      )}
                      {entry.reversedAt && (
                        <tr>
                          <td className="text-surface-500">Reversed</td>
                          <td>{fmtDateTime(entry.reversedAt)}</td>
                        </tr>
                      )}
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

              {/* Metadata card (if present) */}
              {metadata && Object.keys(metadata).length > 0 && (
                <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0">
                      <i className="bx bx-code-block mr-2"></i>
                      Metadata
                    </h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0 p-3 rounded text-[0.8rem] max-h-[300px] overflow-auto bg-surface-100 border border-surface-200">
                      {JSON.stringify(metadata, null, 2)}
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
