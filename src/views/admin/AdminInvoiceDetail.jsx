import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getAdminInvoice } from '../../api/admin.ts'
import { formatAmount } from '../../utils/format'

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
    usdc: ['usd-coin'],
    bnb: ['binance'],
    bsc: ['binance'],
    trx: ['tron'],
    arb: ['arbitrum'],
    op: ['optimism'],
    base: ['base'],
    ln: ['lightning'],
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
    <div className="position-relative me-2" style={{ width: size, height: size, flexShrink: 0 }}>
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

export default function AdminInvoiceDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState(null)

  useEffect(() => {
    loadInvoice()
  }, [id])

  async function loadInvoice() {
    try {
      setLoading(true)
      const data = await getAdminInvoice(token, id)
      setInvoice(data)
    } catch (error) {
      console.error('Failed to load invoice:', error)
      toast.error(t('admin.invoices.loadError', { defaultValue: 'Failed to load invoice' }))
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'paid' || v === 'completed' || v === 'confirmed') return 'badge bg-label-success'
    if (v === 'pending' || v === 'detecting') return 'badge bg-label-warning'
    if (v === 'confirming' || v === 'processing') return 'badge bg-label-info'
    if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-label-secondary'
    if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
    return 'badge bg-label-secondary'
  }

  function paymentStatusBadge(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'confirmed' || v === 'completed') return 'badge bg-label-success'
    if (v === 'detecting' || v === 'pending') return 'badge bg-label-warning'
    if (v === 'confirming') return 'badge bg-label-info'
    if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
    return 'badge bg-label-secondary'
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    }).catch(() => {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    })
  }

  if (loading && !invoice) {
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

  if (!invoice) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning">Invoice not found</div>
      </div>
    )
  }

  const coinSymbol = (invoice.coin?.symbol || invoice.coinSymbol || '').toUpperCase()
  const networkSymbol = (invoice.network?.symbol || invoice.networkSymbol || '').toUpperCase()
  const networkName = invoice.network?.name || invoice.networkName || ''
  const payments = invoice.payments || []

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back button */}
          <div className="mb-4">
            <button className="btn btn-label-secondary" onClick={() => navigate('/admin/invoices')}>
              <i className="bx bx-arrow-back me-1"></i>
              Back to Invoices
            </button>
          </div>

          {/* Invoice Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} />
                  <div>
                    <h4 className="mb-0">
                      Invoice #{invoice.id}
                      {invoice.invoiceNumber && (
                        <small className="text-muted ms-2">({invoice.invoiceNumber})</small>
                      )}
                    </h4>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className={statusBadgeClass(invoice.status)}>
                        {String(invoice.status || '').toUpperCase()}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{coinSymbol} on {networkName || networkSymbol}</span>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={loadInvoice} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Invoice Details</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{invoice.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice Number</td>
                        <td className="fw-medium">{invoice.invoiceNumber || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Public Code</td>
                        <td className="fw-medium">{invoice.publicCode || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Status</td>
                        <td>
                          <span className={statusBadgeClass(invoice.status)}>
                            {String(invoice.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Amount</td>
                        <td className="fw-medium">{formatAmount(invoice.amount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Paid Amount</td>
                        <td className="fw-medium">{formatAmount(invoice.paidAmount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Remaining</td>
                        <td className="fw-medium">
                          {formatAmount(invoice.remainingAmount)} {coinSymbol}
                          {invoice.isFullyPaid && (
                            <span className="badge bg-label-success ms-2">Fully Paid</span>
                          )}
                        </td>
                      </tr>
                      {invoice.amountUsd && (
                        <tr>
                          <td className="text-muted">Amount (USD)</td>
                          <td className="fw-medium">${formatAmount(invoice.amountUsd)}</td>
                        </tr>
                      )}
                      {invoice.usdRate && (
                        <tr>
                          <td className="text-muted">USD Rate</td>
                          <td>
                            ${formatAmount(invoice.usdRate)}
                            {invoice.rateSource && (
                              <small className="text-muted ms-1">({invoice.rateSource})</small>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Coin</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} />
                            <span>{coinSymbol}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Network</td>
                        <td>{networkName || networkSymbol || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Created</td>
                        <td>{formatDate(invoice.createdAt || invoice.created_at)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Expires</td>
                        <td>{formatDate(invoice.expiryAt || invoice.expiry_at)}</td>
                      </tr>
                      {invoice.paidAt && (
                        <tr>
                          <td className="text-muted">Paid At</td>
                          <td>{formatDate(invoice.paidAt || invoice.paid_at)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">User & Address</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>User ID</td>
                        <td className="fw-medium">{invoice.userId || invoice.user?.id || '-'}</td>
                      </tr>
                      {invoice.user?.email && (
                        <tr>
                          <td className="text-muted">Email</td>
                          <td className="fw-medium">{invoice.user.email}</td>
                        </tr>
                      )}
                      {invoice.merchantId && (
                        <tr>
                          <td className="text-muted">Merchant ID</td>
                          <td className="fw-medium">{invoice.merchantId}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Payment Address</td>
                        <td>
                          {invoice.paymentAddress ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {invoice.paymentAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => copyToClipboard(invoice.paymentAddress)}
                                title="Copy"
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      {invoice.memo && (
                        <tr>
                          <td className="text-muted">Memo</td>
                          <td>{invoice.memo}</td>
                        </tr>
                      )}
                      {invoice.description && (
                        <tr>
                          <td className="text-muted">Description</td>
                          <td>{invoice.description}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bx bx-transfer me-2"></i>
                Payments ({payments.length})
              </h5>
            </div>
            <div className="card-body">
              {payments.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No payments recorded for this invoice
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="table table-hover" style={{ minWidth: '900px' }}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: '60px' }}>ID</th>
                        <th style={{ minWidth: '100px' }}>Status</th>
                        <th className="text-end" style={{ minWidth: '150px' }}>Amount</th>
                        <th className="text-end" style={{ minWidth: '150px' }}>Actual Amount</th>
                        <th style={{ minWidth: '120px' }}>Confirmations</th>
                        <th style={{ minWidth: '680px' }}>Tx Hash</th>
                        <th style={{ minWidth: '420px' }}>From Address</th>
                        <th style={{ minWidth: '420px' }}>To Address</th>
                        <th style={{ minWidth: '140px' }}>Detected</th>
                        <th style={{ minWidth: '140px' }}>Confirmed</th>
                        <th style={{ minWidth: '140px' }}>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <span className="fw-semibold text-primary">{payment.id}</span>
                          </td>
                          <td className="text-nowrap">
                            <span className={paymentStatusBadge(payment.status)}>
                              {String(payment.status || '').toUpperCase()}
                            </span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">
                              {formatAmount(payment.amount)} {coinSymbol}
                            </span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">
                              {formatAmount(payment.actualAmount)} {coinSymbol}
                            </span>
                          </td>
                          <td className="text-center text-nowrap">
                            {payment.confirmations != null ? payment.confirmations : '-'}
                            {payment.requiredConfirmations != null && (
                              <small className="text-muted"> / {payment.requiredConfirmations}</small>
                            )}
                          </td>
                          <td>
                            {payment.txHash ? (
                              <div className="d-flex align-items-center">
                                <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                                  {payment.txHash}
                                </span>
                                {invoice.network?.explorerUrl && (
                                  <a
                                    href={`${invoice.network.explorerUrl}/tx/${payment.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                    title="View on explorer"
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
                            {payment.fromAddress ? (
                              <div className="d-flex align-items-center">
                                <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                                  {payment.fromAddress}
                                </span>
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => copyToClipboard(payment.fromAddress)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {payment.toAddress ? (
                              <div className="d-flex align-items-center">
                                <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                                  {payment.toAddress}
                                </span>
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => copyToClipboard(payment.toAddress)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>
                              {payment.detectedAt ? formatDate(payment.detectedAt) : <span className="text-muted">-</span>}
                            </span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>
                              {payment.confirmedAt ? formatDate(payment.confirmedAt) : <span className="text-muted">-</span>}
                            </span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>
                              {payment.completedAt ? formatDate(payment.completedAt) : <span className="text-muted">-</span>}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
