import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getGasTopupById } from '../../api/admin.ts'
import { AmountNormalizer } from '../../utils/amount_normalizer'

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
  const badgeSize = Math.round(size * 0.55)

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

export default function GasTopupDetail() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [topup, setTopup] = useState(null)

  useEffect(() => {
    loadTopup()
  }, [id])

  async function loadTopup() {
    try {
      setLoading(true)
      const data = await getGasTopupById(token, Number(id))
      setTopup(data)
    } catch (error) {
      console.error('Failed to load gas topup:', error)
      toast.error('Failed to load gas topup details')
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals = 18) {
    if (!amountRaw) return '0'
    try {
      const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
      const num = Number(value)
      if (!Number.isFinite(num)) return value
      let result = num.toFixed(8)
      result = result.replace(/\.?0+$/, '')
      return result
    } catch (e) {
      return amountRaw.toString()
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

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    }).catch(() => {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    })
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'pending') return 'badge bg-label-warning'
    if (v === 'processing') return 'badge bg-label-info'
    if (v === 'completed') return 'badge bg-label-success'
    if (v === 'failed') return 'badge bg-label-danger'
    if (v === 'skipped') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
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

  if (!topup) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: '#aaa' }}></i>
          <p className="text-muted mt-2">Gas topup not found</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  // Parse metadata first (needed for fallback values)
  let metadata = {}
  try {
    metadata = typeof topup.metadata === 'string' ? JSON.parse(topup.metadata) : topup.metadata || {}
  } catch (e) { /* ignore */ }

  const coinSymbol = (topup.coinNetwork?.coin?.symbol || topup.coinSymbol || metadata.tokenSymbol || '').toUpperCase()
  const networkSymbol = (topup.coinNetwork?.network?.symbol || topup.networkSymbol || '').toUpperCase()
  const networkName = topup.coinNetwork?.network?.name || topup.networkName || metadata.networkName || ''
  const explorerUrl = topup.coinNetwork?.network?.explorerUrl || topup.explorerUrl || null
  const decimals = topup.coinNetwork?.decimals || topup.decimals || 18

  const failureReason = topup.failureReason || metadata.failureReason || topup.errorMessage || null

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
                      Gas Topup #{topup.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={statusBadgeClass(topup.status)}>
                        {String(topup.status || '').toUpperCase()}
                      </span>
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
                    {formatAmount(topup.topupGasRaw || topup.amountRaw || topup.amount, decimals)}{' '}
                    <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>ETH</span>
                  </div>
                  <small className="text-muted">Topup Gas</small>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Details */}
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
                        <td className="fw-medium">{topup.id}</td>
                      </tr>
                      {topup.sweepId && (
                        <tr>
                          <td className="text-muted">Sweep ID</td>
                          <td>
                            <a href={`/admin/sweep/transactions/${topup.sweepId}`} className="fw-medium">
                              {topup.sweepId}
                            </a>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Coin Network ID</td>
                        <td>{topup.coinNetworkId || 'N/A'}</td>
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
                        <td><span className={statusBadgeClass(topup.status)}>{String(topup.status || '').toUpperCase()}</span></td>
                      </tr>
                      <tr>
                        <td className="text-muted">Topup Gas</td>
                        <td>
                          <span className="fw-bold">
                            {formatAmount(topup.topupGasRaw, decimals)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Topup Gas (Raw)</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{topup.topupGasRaw || 'N/A'}</code></td>
                      </tr>
                      <tr>
                        <td className="text-muted">Required Gas</td>
                        <td>
                          <span className="fw-medium">
                            {formatAmount(topup.requiredGasRaw, decimals)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Required Gas (Raw)</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{topup.requiredGasRaw || 'N/A'}</code></td>
                      </tr>
                      <tr>
                        <td className="text-muted">Decimals</td>
                        <td>{decimals}</td>
                      </tr>
                      {topup.nonce != null && (
                        <tr>
                          <td className="text-muted">Nonce</td>
                          <td>{topup.nonce}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Retry Count</td>
                        <td>
                          <span className={topup.retryCount > 0 ? 'text-warning fw-semibold' : ''}>
                            {topup.retryCount || 0} / {topup.maxRetries ?? 'N/A'}
                          </span>
                        </td>
                      </tr>
                      {topup.systemWalletId && (
                        <tr>
                          <td className="text-muted">System Wallet ID</td>
                          <td>{topup.systemWalletId}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
                          {topup.txHash ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{topup.txHash}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/tx/${topup.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(topup.txHash)}
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
                      {topup.blockNumber && (
                        <tr>
                          <td className="text-muted">Block Number</td>
                          <td>{topup.blockNumber}</td>
                        </tr>
                      )}
                      {topup.gasUsedRaw && (
                        <tr>
                          <td className="text-muted">Gas Used</td>
                          <td><code style={{ fontSize: '0.8rem' }}>{topup.gasUsedRaw}</code></td>
                        </tr>
                      )}
                      {topup.gasPriceRaw && (
                        <tr>
                          <td className="text-muted">Gas Price</td>
                          <td><code style={{ fontSize: '0.8rem' }}>{topup.gasPriceRaw}</code></td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">From Address</td>
                        <td>
                          {topup.fromAddress ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{topup.fromAddress}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/address/${topup.fromAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(topup.fromAddress)}
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
                          {topup.toAddress ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{topup.toAddress}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/address/${topup.toAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(topup.toAddress)}
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
                        <td>{formatDate(topup.createdAt)}</td>
                      </tr>
                      {topup.processingStartedAt && (
                        <tr>
                          <td className="text-muted">Processing Started</td>
                          <td>{formatDate(topup.processingStartedAt)}</td>
                        </tr>
                      )}
                      {topup.completedAt && (
                        <tr>
                          <td className="text-muted">Completed</td>
                          <td>{formatDate(topup.completedAt)}</td>
                        </tr>
                      )}
                      {topup.updatedAt && (
                        <tr>
                          <td className="text-muted">Updated</td>
                          <td>{formatDate(topup.updatedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
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
                    {metadata.tokenSymbol && (
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>Token Symbol</td>
                        <td>{metadata.tokenSymbol}</td>
                      </tr>
                    )}
                    {metadata.tokenContractAddress && (
                      <tr>
                        <td className="text-muted">Token Contract</td>
                        <td>
                          <code className="text-break" style={{ fontSize: '0.75rem' }}>{metadata.tokenContractAddress}</code>
                          {explorerUrl && (
                            <a
                              href={`${explorerUrl}/address/${metadata.tokenContractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-icon btn-text-secondary rounded-pill ms-1"
                              title="View on explorer"
                            >
                              <i className="bx bx-link-external"></i>
                            </a>
                          )}
                        </td>
                      </tr>
                    )}
                    {metadata.networkName && (
                      <tr>
                        <td className="text-muted">Network</td>
                        <td>{metadata.networkName}</td>
                      </tr>
                    )}
                    {metadata.createdByTask && (
                      <tr>
                        <td className="text-muted">Created By</td>
                        <td><code>{metadata.createdByTask}</code></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failure Reason */}
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
