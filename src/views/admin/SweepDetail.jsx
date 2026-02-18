import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getSweepById } from '../../api/admin.ts'
import { AmountNormalizer } from '../../utils/amount_normalizer'
import { formatUsd } from '../../utils/format'

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

export default function SweepDetail() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [sweep, setSweep] = useState(null)

  useEffect(() => {
    loadSweep()
  }, [id])

  async function loadSweep() {
    try {
      setLoading(true)
      const data = await getSweepById(token, parseInt(id))
      setSweep(data)
    } catch (error) {
      console.error('Failed to load sweep transaction:', error)
      toast.error('Failed to load sweep transaction')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  function formatAmount(amountRaw, decimals, coinSymbol, networkSymbol) {
    if (!amountRaw || !decimals) return '0'
    try {
      const chain = AmountNormalizer.detectChain(coinSymbol || '', networkSymbol || '')
      return AmountNormalizer.fromRaw(amountRaw.toString(), chain, decimals)
    } catch (error) {
      const amount = Number(amountRaw) / Math.pow(10, decimals)
      return amount.toString()
    }
  }


  function statusBadgeClass(s) {
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
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

  if (!sweep) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: '#aaa' }}></i>
          <p className="text-muted mt-2">Sweep transaction not found</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  // Support both nested coinNetwork object and flat fields
  const coinSymbol = (sweep.coinNetwork?.coin?.symbol || sweep.coinSymbol || '').toUpperCase()
  const networkSymbol = (sweep.coinNetwork?.network?.symbol || sweep.networkSymbol || '').toUpperCase()
  const networkName = sweep.coinNetwork?.network?.name || sweep.networkName || ''
  const explorerUrl = sweep.coinNetwork?.network?.explorerUrl || sweep.explorerUrl || null

  // Parse metadata
  let metadata = {}
  try {
    metadata = typeof sweep.metadata === 'string' ? JSON.parse(sweep.metadata) : sweep.metadata || {}
  } catch (e) { /* ignore */ }

  const failureReason = metadata.failureReason || null

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
                  {coinSymbol && (
                    <CoinImg
                      symbol={coinSymbol}
                      networkSymbol={networkSymbol}
                      size={48}
                    />
                  )}
                  <div>
                    <h4 className="mb-1">
                      Sweep Transaction #{sweep.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={statusBadgeClass(sweep.status)}>
                        {String(sweep.status || '').toUpperCase()}
                      </span>
                      {metadata.type && (
                        <span className="badge bg-label-info">
                          {metadata.type}
                        </span>
                      )}
                      {coinSymbol && (
                        <span className="badge bg-label-secondary">
                          {coinSymbol}
                        </span>
                      )}
                      {networkName && (
                        <span className="badge bg-label-secondary">
                          {networkName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fs-4 fw-bold">
                    {sweep.amount || formatAmount(sweep.amountRaw, sweep.decimals, coinSymbol, networkSymbol)}{' '}
                    <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>{coinSymbol}</span>
                  </div>
                  {sweep.amountUsd && (
                    <div className="text-muted">
                      {formatUsd(sweep.amountUsd)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Sweep Details */}
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
                        <td className="fw-medium">{sweep.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">User ID</td>
                        <td>{sweep.userId || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Coin Network ID</td>
                        <td>{sweep.coinNetworkId || 'N/A'}</td>
                      </tr>
                      {coinSymbol && (
                        <tr>
                          <td className="text-muted">Coin</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} />
                              <div>
                                <span className="fw-medium">{coinSymbol}</span>
                                {networkName && (
                                  <small className="text-muted ms-1">/ {networkName}</small>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Status</td>
                        <td><span className={statusBadgeClass(sweep.status)}>{String(sweep.status || '').toUpperCase()}</span></td>
                      </tr>
                      <tr>
                        <td className="text-muted">Amount</td>
                        <td>
                          <span className="fw-bold">
                            {sweep.amount || formatAmount(sweep.amountRaw, sweep.decimals, coinSymbol, networkSymbol)}
                          </span>
                        </td>
                      </tr>
                      {sweep.actualAmount && (
                        <tr>
                          <td className="text-muted">Actual Amount</td>
                          <td><span className="fw-medium">{sweep.actualAmount}</span></td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Amount (Raw)</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{sweep.amountRaw || 'N/A'}</code></td>
                      </tr>
                      {sweep.amountUsd && (
                        <tr>
                          <td className="text-muted">USD Value</td>
                          <td>{formatUsd(sweep.amountUsd)}</td>
                        </tr>
                      )}
                      {sweep.usdRate && (
                        <tr>
                          <td className="text-muted">USD Rate</td>
                          <td>
                            {formatUsd(sweep.usdRate)}
                            {sweep.rateSource && <small className="text-muted ms-1">({sweep.rateSource})</small>}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Decimals</td>
                        <td>{sweep.decimals ?? 'N/A'}</td>
                      </tr>
                      {sweep.reservationId && (
                        <tr>
                          <td className="text-muted">Reservation ID</td>
                          <td><code style={{ fontSize: '0.8rem' }}>{sweep.reservationId}</code></td>
                        </tr>
                      )}
                      {sweep.systemWalletId && (
                        <tr>
                          <td className="text-muted">System Wallet ID</td>
                          <td>{sweep.systemWalletId}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Metadata / Invoice Info */}
              {metadata && Object.keys(metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bx bx-info-circle me-2"></i>
                      Metadata
                    </h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-borderless">
                      <tbody>
                        {metadata.strategy && (
                          <tr>
                            <td className="text-muted" style={{ width: '40%' }}>Strategy</td>
                            <td>{metadata.strategy}</td>
                          </tr>
                        )}
                        {metadata.invoiceNumber && (
                          <tr>
                            <td className="text-muted">Invoice</td>
                            <td>
                              <code>{metadata.invoiceNumber}</code>
                              {metadata.invoiceStatus && (
                                <span className="badge bg-label-secondary ms-2">{metadata.invoiceStatus}</span>
                              )}
                            </td>
                          </tr>
                        )}
                        {metadata.paymentCount != null && (
                          <tr>
                            <td className="text-muted">Payment Count</td>
                            <td>{metadata.paymentCount}</td>
                          </tr>
                        )}
                        {metadata.paymentIds && (
                          <tr>
                            <td className="text-muted">Payment IDs</td>
                            <td>{metadata.paymentIds.join(', ')}</td>
                          </tr>
                        )}
                        {metadata.ledgerEntryIds && (
                          <tr>
                            <td className="text-muted">Ledger Entry IDs</td>
                            <td>{metadata.ledgerEntryIds.join(', ')}</td>
                          </tr>
                        )}
                        {metadata.note && (
                          <tr>
                            <td className="text-muted">Note</td>
                            <td>{metadata.note}</td>
                          </tr>
                        )}
                        {metadata.retryCount != null && (
                          <tr>
                            <td className="text-muted">Retry Count</td>
                            <td>{metadata.retryCount}</td>
                          </tr>
                        )}
                        {metadata.jobName && (
                          <tr>
                            <td className="text-muted">Job</td>
                            <td><code>{metadata.jobName}</code></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction & Addresses */}
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
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>Tx Hash</td>
                        <td>
                          {sweep.txHash ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{sweep.txHash}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/tx/${sweep.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(sweep.txHash)}
                                >
                                  <i className="bx bx-copy me-1"></i>Copy
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      {sweep.blockNumber && (
                        <tr>
                          <td className="text-muted">Block Number</td>
                          <td>{sweep.blockNumber}</td>
                        </tr>
                      )}
                      {sweep.gasFee && (
                        <tr>
                          <td className="text-muted">Gas Fee</td>
                          <td>{sweep.gasFee}</td>
                        </tr>
                      )}
                      {sweep.networkFeeRaw && (
                        <tr>
                          <td className="text-muted">Network Fee (Raw)</td>
                          <td><code style={{ fontSize: '0.8rem' }}>{sweep.networkFeeRaw}</code></td>
                        </tr>
                      )}
                      {sweep.networkFeeUsd && (
                        <tr>
                          <td className="text-muted">Network Fee (USD)</td>
                          <td>{formatUsd(sweep.networkFeeUsd)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">From Address</td>
                        <td>
                          {sweep.fromAddress ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{sweep.fromAddress}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/address/${sweep.fromAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(sweep.fromAddress)}
                                >
                                  <i className="bx bx-copy me-1"></i>Copy
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">To Address</td>
                        <td>
                          {sweep.toAddress ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{sweep.toAddress}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/address/${sweep.toAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(sweep.toAddress)}
                                >
                                  <i className="bx bx-copy me-1"></i>Copy
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                      </tr>
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
                        <td>{formatDate(sweep.createdAt)}</td>
                      </tr>
                      {sweep.completedAt && (
                        <tr>
                          <td className="text-muted">Completed</td>
                          <td>{formatDate(sweep.completedAt)}</td>
                        </tr>
                      )}
                      {sweep.updatedAt && (
                        <tr>
                          <td className="text-muted">Updated</td>
                          <td>{formatDate(sweep.updatedAt)}</td>
                        </tr>
                      )}
                      {metadata.lastAttemptAt && (
                        <tr>
                          <td className="text-muted">Last Attempt</td>
                          <td>{formatDate(metadata.lastAttemptAt)}</td>
                        </tr>
                      )}
                      {metadata.failedAt && (
                        <tr>
                          <td className="text-muted">Failed At</td>
                          <td className="text-danger">{formatDate(metadata.failedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Failure Reason (if failed) */}
          {failureReason && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0 text-danger">
                  <i className="bx bx-error me-2"></i>
                  Failure Reason
                </h5>
              </div>
              <div className="card-body">
                <pre className="mb-0 text-danger" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                  {failureReason}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
