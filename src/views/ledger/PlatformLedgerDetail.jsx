import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getPlatformLedgerEntry } from '../../api/admin.ts'

function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'],
    eth: ['ethereum'],
    doge: ['dogecoin'],
    sol: ['solana'],
    matic: ['polygon'],
    pol: ['polygon'],
    ada: ['cardano'],
    xmr: ['monero'],
    zec: ['zcash'],
    usdt: ['usdterc20', 'tether'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) =>
    exts.map((ext) => `/assets/img/coins/${n}.${ext}`)
  )
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    '/assets/img/coins/default.svg',
  ]
  return Array.from(new Set(candidates))
}

function CoinImg({ symbol, networkSymbol, size = 32 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, null),
    [symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null),
    [networkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 18

  return (
    <div className="position-relative me-3" style={{ width: size, height: size, flexShrink: 0 }}>
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
        onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
      />
      {networkSymbol && networkSymbol !== symbol &&
       !(symbol === 'POL' && networkSymbol === 'MATIC') && (
        <div
          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
          style={{
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '2px'
          }}
        >
          <img
            src={netSrc}
            alt={networkSymbol}
            width={badgeSize - 4}
            height={badgeSize - 4}
            className="rounded-circle"
            style={{ objectFit: 'cover' }}
            onError={() => setNetIdx((i) => (i + 1 < networkCandidates.length ? i + 1 : i))}
          />
        </div>
      )}
    </div>
  )
}

export default function PlatformLedgerDetail() {
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
      const data = await getPlatformLedgerEntry(token, parseInt(id))
      setEntry(data)
    } catch (error) {
      console.error('Failed to load platform ledger entry:', error)
      toast.error(t('admin.platformLedger.loadError', { defaultValue: 'Failed to load platform ledger entry' }))
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

  function formatUsd(val) {
    if (!val && val !== 0) return '$0.00'
    const num = parseFloat(val)
    if (Math.abs(num) < 0.01 && num !== 0) {
      return '$' + num.toFixed(8).replace(/0+$/, '').replace(/\.$/, '.00')
    }
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function stateBadge(state) {
    if (state === 'settled') return <span>Settled</span>
    if (state === 'committed') return <span>Committed</span>
    if (state === 'reversed') return <span>Reversed</span>
    return <span className="text-muted">{state || 'N/A'}</span>
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    }).catch(() => {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    })
  }

  const entryCodeLabels = {
    'WF': 'Withdrawal Fee',
    'FR': 'Fee Refund',
    'SG': 'Sweep Gas Topup',
    'SC': 'Sweep Gas Cost',
    'WG': 'Withdrawal Gas',
    'XI': 'Internal Transfer In',
    'XO': 'Internal Transfer Out',
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
          <p className="text-muted mt-2">{t('admin.platformLedger.notFound', { defaultValue: 'Platform ledger entry not found' })}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
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
                      Platform Ledger Entry #{entry.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`badge ${entry.accountType === 'revenue' ? 'bg-label-success' : 'bg-label-warning'}`}>
                        {entry.accountType === 'revenue' ? 'Revenue' : 'Expense'}
                      </span>
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
                </div>
                <div className="text-end">
                  <div className={`fs-4 fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                    {isCredit ? '+' : '-'}{formatAmount(entry.amount)} <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>{entry.coinSymbol}</span>
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
                    Details
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
                        <td className="text-muted">Account Type</td>
                        <td>
                          <span className={`badge ${entry.accountType === 'revenue' ? 'bg-label-success' : 'bg-label-warning'}`}>
                            {entry.accountType === 'revenue' ? 'Revenue' : 'Expense'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Coin</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} />
                            <span className="fw-medium">{entry.coinSymbol || '-'}</span>
                            {entry.networkName && <span className="text-muted ms-1">({entry.networkName})</span>}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Entry Code</td>
                        <td>
                          <span className="fw-medium">{entry.entryCode || '-'}</span>
                          {entry.entryCode && entryCodeLabels[entry.entryCode] && (
                            <span className="text-muted ms-1">- {entryCodeLabels[entry.entryCode]}</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Entry Type</td>
                        <td>
                          <span className={`badge ${isCredit ? 'bg-label-success' : 'bg-label-danger'}`}>
                            {isCredit ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">State</td>
                        <td>{stateBadge(entry.state)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Amount</td>
                        <td>
                          <span className={`fw-medium ${isCredit ? 'text-success' : 'text-danger'}`}>
                            {isCredit ? '+' : '-'}{formatAmount(entry.amount)} {entry.coinSymbol}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD Value</td>
                        <td className="fw-medium">{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Created</td>
                        <td>{formatDate(entry.createdAt)}</td>
                      </tr>
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
            </div>

            {/* Transaction & Metadata */}
            <div className="col-md-6">
              {entry.txHash && (
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
                        <tr>
                          <td className="text-muted" style={{ width: '30%' }}>Tx Hash</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <code className="me-2" style={{ wordBreak: 'break-all' }}>{entry.txHash}</code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary"
                                onClick={() => copyToClipboard(entry.txHash)}
                                title="Copy"
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                              {explorerUrl && (
                                <a
                                  href={`${explorerUrl}/tx/${entry.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn-text-secondary"
                                  title="View on explorer"
                                >
                                  <i className="bx bx-link-external"></i>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {metadata && Object.keys(metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bx bx-code-alt me-2"></i>
                      Metadata
                    </h5>
                  </div>
                  <div className="card-body">
                    <pre className="bg-lighter p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto' }}>
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
