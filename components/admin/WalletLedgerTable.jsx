'use client'

import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import CardEmptyState from '@/components/CardEmptyState'

function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

function parseMetadata(entry) {
  try {
    return typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
  } catch { return {} }
}

function getPurposeLabel(metadata) {
  if (!metadata) return null
  const purposeMap = {
    'payment_received': 'Payment Received',
    'merchant_credit': 'Merchant Credit',
    'native_coin_sweep_cost': 'Sweep Cost',
    'gas_topup_for_token_sweep': 'Gas Top-up',
    'token_sweep_cost': 'Token Sweep Cost',
  }
  return purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null
}

export default function WalletLedgerTable({ entries, loading, t }) {
  const { fmtDate } = useDateFormat()
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <CardEmptyState
        icon="bx-receipt"
        message={t('admin.ledger.noEntries', { defaultValue: 'No ledger entries found' })}
        sub={t('admin.ledger.noEntriesDesc', { defaultValue: 'Try adjusting your filters to see more results' })}
      />
    )
  }

  return (
    <div className="table-responsive" style={{ overflowX: 'auto' }}>
      <table className="table table-hover" style={{ minWidth: '1200px' }}>
        <thead>
          <tr style={{ whiteSpace: 'nowrap' }}>
            <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
            <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
            <th>{t('admin.detail.coin', { defaultValue: 'Coin' })}</th>
            <th>{t('admin.detail.code', { defaultValue: 'Code' })}</th>
            <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
            <th className="text-end">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
            <th className="text-end">USD</th>
            <th>{t('admin.detail.purpose', { defaultValue: 'Purpose' })}</th>
            <th>{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</th>
            <th>{t('admin.ledger.createdAt', { defaultValue: 'Created' })}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCredit = entry.entryType === 'credit'
            const metadata = parseMetadata(entry)
            const purposeLabel = getPurposeLabel(metadata)
            const decimals = entry.decimals || 18
            const amount = entry.amount || AmountNormalizer.fromRawSimple(entry.amountRaw || '0', decimals)

            return (
              <tr key={entry.id}>
                <td>
                  <span className="fw-semibold text-primary">{entry.id}</span>
                </td>
                <td>
                  <span className={`badge ${entry.state === 'reversed' ? 'bg-label-secondary' : (isCredit ? 'bg-label-danger' : 'bg-label-success')}`}>
                    <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} me-1`}></i>
                    {isCredit ? 'Credit' : 'Debit'}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div className="d-flex align-items-center">
                    <CoinImg
                      symbol={entry.coinSymbol || metadata?.coin}
                      networkSymbol={entry.networkSymbol || metadata?.network}
                      size={24}
                      className="me-3"
                    />
                    <div>
                      <div className="fw-medium" style={{ lineHeight: 1.2 }}>{entry.coinSymbol || metadata?.coin || '-'}</div>
                      {(entry.networkName || metadata?.networkName) && (
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.networkName || metadata?.networkName}</small>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {entry.entryCode ? (
                    <span className="fw-medium">{entry.entryCode}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {entry.state === 'settled' ? <span className="badge bg-label-success">Settled</span>
                    : entry.state === 'committed' ? <span className="badge bg-label-info">Committed</span>
                    : entry.state === 'pending' ? <span className="badge bg-label-warning">{t('status.pending', { defaultValue: 'Pending' })}</span>
                    : entry.state === 'reversed' ? <span className="badge bg-label-secondary">Reversed</span>
                    : <span className="text-muted">{entry.state || 'N/A'}</span>}
                </td>
                <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                  <span className={`fw-medium ${isCredit ? 'text-danger' : 'text-success'}`}>
                    {isCredit ? '-' : '+'}{formatAmount(amount)}
                  </span>
                </td>
                <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                  <span className="text-muted">{formatUsd(entry.amountUsd)}</span>
                </td>
                <td>
                  <div>
                    {purposeLabel && (
                      <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{purposeLabel}</div>
                    )}
                    {metadata?.invoiceNumber && (
                      <small className="badge bg-label-primary">{metadata.invoiceNumber}</small>
                    )}
                    {metadata?.sweepId && !metadata?.invoiceNumber && (
                      <small className="text-muted">Sweep #{metadata.sweepId}</small>
                    )}
                    {!purposeLabel && !metadata?.invoiceNumber && !metadata?.sweepId && (
                      <span className="text-muted">-</span>
                    )}
                  </div>
                </td>
                <td>
                  {entry.txHash ? (
                    <div className="d-flex align-items-center">
                      <span className="me-2">{entry.txHash}</span>
                      {entry.explorerUrl && (
                        <a
                          href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                          onClick={(e) => e.stopPropagation()}
                          title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                        >
                          <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(entry.createdAt)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
