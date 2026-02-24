import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getSystemLedgerEntry } from '../../api/admin.ts'
import { formatUsd } from '../../utils/format'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard as copyText } from '../../utils/clipboard'
import { formatAmount, stateBadge, entryCodeLabels, getPurposeLabel, parseMetadata } from './ledgerUtils'
import { TransactionCard, TimestampsCard, MetadataCard } from './SystemLedgerDetailCards'

export default function SystemLedgerDetail() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)

  useEffect(() => {
    loadEntry()
  }, [id])

  async function loadEntry() {
    try {
      setLoading(true)
      const data = await getSystemLedgerEntry(token, parseInt(id))
      setEntry(data)
    } catch (error) {
      console.error('Failed to load system ledger entry:', error)
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entry' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    else toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
  }

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">{t('admin.ledger.notFound', { defaultValue: 'Ledger entry not found' })}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  const isCredit = entry.entryType === 'credit'
  const isReversed = entry.state === 'reversed'
  const metadata = parseMetadata(entry)
  const purposeLabel = getPurposeLabel(metadata)
  const explorerUrl = entry.explorerUrl || null

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline-secondary mb-3"
          >
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          {/* Header */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  {entry.coinSymbol && (
                    <CoinImg
                      symbol={entry.coinSymbol}
                      networkSymbol={entry.networkSymbol}
                      size={48}
                    />
                  )}
                  <div>
                    <h4 className="mb-1">
                      {t('admin.ledger.systemLedgerEntry', { defaultValue: 'System Ledger Entry' })} #{entry.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`badge ${entry.state === 'reversed' ? 'bg-label-secondary' : (isCredit ? 'bg-label-danger' : 'bg-label-success')}`}>
                        <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} me-1`}></i>
                        {isCredit ? 'Credit' : 'Debit'}
                      </span>
                      {entry.entryCode && (
                        <span className="badge bg-label-secondary">
                          {entryCodeLabels[entry.entryCode] || entry.entryCode}
                        </span>
                      )}
                      {stateBadge(entry.state)}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className={`fs-4 fw-bold ${isReversed ? '' : (isCredit ? 'text-danger' : 'text-success')}`}>
                    {isReversed ? '' : (isCredit ? '-' : '+')}{formatAmount(entry.amount)} <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>{entry.coinSymbol}</span>
                  </div>
                  <div className="text-muted">
                    {formatUsd(entry.amountUsd)}
                  </div>
                  {entry.networkName && (
                    <small className="text-muted">{entry.networkName}</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Entry Details */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-detail me-2"></i>
                    {t('admin.ledger.details', { defaultValue: 'Details' })}
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{entry.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Wallet ID</td>
                        <td>{entry.walletId || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.ledger.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="me-3" />
                            <div>
                              <span className="fw-medium">{entry.coinSymbol || 'N/A'}</span>
                              {entry.networkName && (
                                <small className="text-muted ms-1">/ {entry.networkName}</small>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.ledger.entryType', { defaultValue: 'Entry Type' })}</td>
                        <td>
                          <span className={`badge ${entry.state === 'reversed' ? 'bg-label-secondary' : (isCredit ? 'bg-label-danger' : 'bg-label-success')}`}>
                            {isCredit ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                      </tr>
                      {entry.entryCode && (
                        <tr>
                          <td className="text-muted">Entry Code</td>
                          <td>
                            <code>{entry.entryCode}</code>
                            <span className="text-muted ms-2">({entryCodeLabels[entry.entryCode] || entry.entryCode})</span>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">{t('admin.ledger.state', { defaultValue: 'State' })}</td>
                        <td>{stateBadge(entry.state)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className={`fw-bold ${isReversed ? '' : (isCredit ? 'text-danger' : 'text-success')}`}>
                            {isReversed ? '' : (isCredit ? '-' : '+')}{formatAmount(entry.amount)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Amount (Raw)</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{entry.amountRaw || 'N/A'}</code></td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD Value</td>
                        <td>{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD Rate</td>
                        <td>
                          {entry.usdRate ? formatUsd(entry.usdRate) : 'N/A'}
                          {entry.rateSource && <small className="text-muted ms-1">({entry.rateSource})</small>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Decimals</td>
                        <td>{entry.decimals ?? 'N/A'}</td>
                      </tr>
                      {purposeLabel && (
                        <tr>
                          <td className="text-muted">Purpose</td>
                          <td className="fw-medium">{purposeLabel}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Transaction, Timestamps & Metadata */}
            <div className="col-md-6">
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
