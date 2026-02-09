import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getSystemLedgerEntry } from '../../api/admin.ts'

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

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  function formatAmount(val) {
    if (!val && val !== 0) return '0'
    let str = String(val)
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '')
    }
    return str || '0'
  }

  function stateBadge(state) {
    if (state === 'settled') return <span className="badge bg-label-success"><i className="bx bx-check-double me-1"></i>Settled</span>
    if (state === 'committed') return <span className="badge bg-label-info"><i className="bx bx-check-circle me-1"></i>Committed</span>
    if (state === 'pending') return <span className="badge bg-label-warning"><i className="bx bx-time me-1"></i>Pending</span>
    if (state === 'reversed') return <span className="badge bg-label-danger"><i className="bx bx-revision me-1"></i>Reversed</span>
    return <span className="badge bg-label-secondary">{state || 'N/A'}</span>
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    }).catch(() => {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    })
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
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: '#aaa' }}></i>
          <p className="text-muted mt-2">{t('admin.ledger.notFound', { defaultValue: 'Ledger entry not found' })}</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/ledger/system')}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  const isCredit = entry.entryType === 'credit'

  // Parse metadata
  let metadata = {}
  try {
    metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
  } catch (e) { /* ignore */ }

  const networkSymbol = metadata?.networkSymbol || ''

  // Entry code labels
  const entryCodeLabels = {
    'SP': 'Settlement Payment',
    'SC': 'Sweep Cost',
    'SG': 'Sweep Gas',
    'WD': 'Withdrawal',
    'DP': 'Deposit',
    'FE': 'Fee',
    'AJ': 'Adjustment',
  }

  const purposeMap = {
    'payment_received': 'Payment Received',
    'merchant_credit': 'Merchant Credit',
    'native_coin_sweep_cost': 'Sweep Cost',
    'gas_topup_for_token_sweep': 'Gas Top-up',
    'token_sweep_cost': 'Token Sweep Cost',
  }
  const purposeLabel = purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null

  function formatUsd(val) {
    if (!val && val !== 0) return '$0.00'
    const num = parseFloat(val)
    if (Math.abs(num) < 0.01 && num !== 0) {
      return '$' + num.toFixed(8).replace(/0+$/, '').replace(/\.$/, '.00')
    }
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Explorer URL from network symbol
  const explorerUrls = {
    'ETH': 'https://etherscan.io',
    'BSC': 'https://bscscan.com',
    'POL': 'https://polygonscan.com',
    'MATIC': 'https://polygonscan.com',
    'OPTIMISM': 'https://optimistic.etherscan.io',
    'OP': 'https://optimistic.etherscan.io',
    'ARB': 'https://arbiscan.io',
    'ARBITRUM': 'https://arbiscan.io',
    'AVAX': 'https://snowtrace.io',
    'FTM': 'https://ftmscan.com',
    'BASE': 'https://basescan.org',
  }
  const explorerUrl = explorerUrls[networkSymbol?.toUpperCase()] || null

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/ledger/system')}
            className="btn btn-outline-secondary mb-3"
          >
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          {/* Header */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    {t('admin.ledger.systemLedgerEntry', { defaultValue: 'System Ledger Entry' })} #{entry.id}
                  </h4>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className={`badge ${isCredit ? 'bg-label-success' : 'bg-label-danger'}`}>
                      <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} me-1`}></i>
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
                <div className="text-end">
                  <div className={`fs-4 fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                    {isCredit ? '+' : '-'}{formatAmount(entry.amount)}
                  </div>
                  <div className="text-muted">
                    {formatUsd(entry.amountUsd)}
                    {networkSymbol && <span className="ms-2 badge bg-label-secondary">{networkSymbol}</span>}
                  </div>
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
                        <td className="text-muted">Coin Network ID</td>
                        <td>{entry.coinNetworkId || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.ledger.entryType', { defaultValue: 'Entry Type' })}</td>
                        <td>
                          <span className={`badge ${isCredit ? 'bg-label-success' : 'bg-label-danger'}`}>
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
                          <span className={`fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                            {isCredit ? '+' : '-'}{formatAmount(entry.amount)}
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
                          {entry.usdRate ? `$${parseFloat(entry.usdRate).toLocaleString()}` : 'N/A'}
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

            {/* Transaction & Timestamps */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-link me-2"></i>
                    Transaction
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      {entry.reservationId && (
                        <tr>
                          <td className="text-muted" style={{ width: '40%' }}>Reservation ID</td>
                          <td><code>{entry.reservationId}</code></td>
                        </tr>
                      )}
                      {entry.relatedId && (
                        <tr>
                          <td className="text-muted">Related ID</td>
                          <td>#{entry.relatedId}</td>
                        </tr>
                      )}
                      {entry.txHash && (
                        <tr>
                          <td className="text-muted">Tx Hash</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{entry.txHash}</code>
                            </div>
                            <div className="d-flex gap-1 mt-1">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => copyToClipboard(entry.txHash)}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                <i className="bx bx-copy me-1"></i>Copy
                              </button>
                              {explorerUrl && (
                                <a
                                  href={`${explorerUrl}/tx/${entry.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  <i className="bx bx-link-external me-1"></i>Explorer
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      {metadata?.invoiceNumber && (
                        <tr>
                          <td className="text-muted">Invoice</td>
                          <td><span className="badge bg-label-primary">{metadata.invoiceNumber}</span></td>
                        </tr>
                      )}
                      {metadata?.sweepId && (
                        <tr>
                          <td className="text-muted">Sweep ID</td>
                          <td>#{metadata.sweepId}</td>
                        </tr>
                      )}
                      {metadata?.note && (
                        <tr>
                          <td className="text-muted">Note</td>
                          <td className="text-muted" style={{ fontSize: '0.85rem' }}>{metadata.note}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timestamps */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-time me-2"></i>
                    Timestamps
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>Created</td>
                        <td>{formatDate(entry.createdAt)}</td>
                      </tr>
                      {entry.committedAt && (
                        <tr>
                          <td className="text-muted">Committed</td>
                          <td>{formatDate(entry.committedAt)}</td>
                        </tr>
                      )}
                      {entry.settledAt && (
                        <tr>
                          <td className="text-muted">Settled</td>
                          <td>{formatDate(entry.settledAt)}</td>
                        </tr>
                      )}
                      {entry.reversedAt && (
                        <tr>
                          <td className="text-muted">Reversed</td>
                          <td>{formatDate(entry.reversedAt)}</td>
                        </tr>
                      )}
                      {entry.updatedAt && (
                        <tr>
                          <td className="text-muted">Updated</td>
                          <td>{formatDate(entry.updatedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Metadata card (if present) */}
              {Object.keys(metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bx bx-code-block me-2"></i>
                      Metadata
                    </h5>
                  </div>
                  <div className="card-body">
                    <pre className="mb-0 p-3 bg-light rounded" style={{ fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto' }}>
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
