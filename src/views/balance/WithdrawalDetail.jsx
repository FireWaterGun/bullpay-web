import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getWithdrawalById } from '../../api/withdrawals'
import { AmountNormalizer } from '../../utils/amount_normalizer'
import { formatCoinAmount, formatUsd } from '../../utils/format'

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

export default function WithdrawalDetail() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [withdrawal, setWithdrawal] = useState(null)

  useEffect(() => {
    loadWithdrawal()
  }, [id])

  async function loadWithdrawal() {
    try {
      setLoading(true)
      const data = await getWithdrawalById(id, token)
      setWithdrawal(data)
    } catch (error) {
      console.error('Failed to load withdrawal:', error)
      toast.error(t('withdrawal.loadError', { defaultValue: 'Failed to load withdrawal details' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals = 18) {
    if (!amountRaw) return '0'
    try {
      const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
      return formatCoinAmount(value)
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
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED' || v === 'WAITING_FOR_GAS') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
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

  if (!withdrawal) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: '#aaa' }}></i>
          <p className="text-muted mt-2">{t('withdrawal.notFound', { defaultValue: 'Withdrawal not found' })}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  const coinSymbol = (withdrawal.coinNetwork?.coin?.symbol || withdrawal.coin?.symbol || withdrawal.coinSymbol || withdrawal.symbol || '').toUpperCase()
  const networkSymbol = (withdrawal.coinNetwork?.network?.symbol || withdrawal.network?.symbol || withdrawal.networkSymbol || '').toUpperCase()
  const networkName = withdrawal.coinNetwork?.network?.name || withdrawal.network?.name || withdrawal.networkName || ''
  const explorerUrl = withdrawal.coinNetwork?.network?.explorerUrl || withdrawal.network?.explorerUrl || withdrawal.explorerUrl || null
  const decimals = withdrawal.coinNetwork?.decimals || withdrawal.decimals || 18

  // Parse metadata
  let metadata = {}
  try {
    metadata = typeof withdrawal.metadata === 'string' ? JSON.parse(withdrawal.metadata) : withdrawal.metadata || {}
  } catch (e) { /* ignore */ }

  const failureReason = withdrawal.failureReason || metadata.failureReason || withdrawal.errorMessage || withdrawal.rejectReason || null

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
                      {t('withdrawal.detail', { defaultValue: 'Withdrawal' })} #{withdrawal.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={statusBadgeClass(withdrawal.status)}>
                        {String(withdrawal.status || '').toUpperCase()}
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
                    {withdrawal.amount || formatAmount(withdrawal.amountRaw, decimals)}{' '}
                    <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>{coinSymbol}</span>
                  </div>
                  {withdrawal.amountUsd && (
                    <div className="text-muted">
                      {formatUsd(withdrawal.amountUsd)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Withdrawal Details */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-detail me-2"></i>
                    {t('withdrawal.details', { defaultValue: 'Details' })}
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{withdrawal.id}</td>
                      </tr>
                      {coinSymbol && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.coin', { defaultValue: 'Coin' })}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} />
                              <div>
                                <span className="fw-medium">{coinSymbol}</span>
                                {withdrawal.coinNetwork?.coin?.name && (
                                  <small className="text-muted ms-1">({withdrawal.coinNetwork.coin.name})</small>
                                )}
                                {networkName && (
                                  <small className="text-muted ms-1">/ {networkName}</small>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {withdrawal.currencyType && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.currencyType', { defaultValue: 'Type' })}</td>
                          <td><span className="badge bg-label-info">{withdrawal.currencyType}</span></td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">{t('withdrawal.status', { defaultValue: 'Status' })}</td>
                        <td><span className={statusBadgeClass(withdrawal.status)}>{String(withdrawal.status || '').toUpperCase()}</span></td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('withdrawal.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className="fw-bold">
                            {withdrawal.amount || formatAmount(withdrawal.amountRaw, decimals)} {coinSymbol}
                          </span>
                        </td>
                      </tr>
                      {withdrawal.totalFee && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.totalFee', { defaultValue: 'Total Fee' })}</td>
                          <td>
                            <span className="fw-medium">
                              {withdrawal.totalFee} {coinSymbol}
                            </span>
                          </td>
                        </tr>
                      )}
                      {withdrawal.networkFeeAmount && withdrawal.networkFeeAmount !== '0.000000000000000000' && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.networkFee', { defaultValue: 'Network Fee' })}</td>
                          <td>
                            <span className="text-muted">{withdrawal.networkFeeAmount}</span>
                            {withdrawal.networkFeeUsd && parseFloat(withdrawal.networkFeeUsd) > 0 && (
                              <small className="text-muted ms-2">({formatUsd(withdrawal.networkFeeUsd)})</small>
                            )}
                          </td>
                        </tr>
                      )}
                      {withdrawal.totalAmount && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.totalAmount', { defaultValue: 'Total Amount' })}</td>
                          <td>
                            <span className="fw-bold text-primary">
                              {withdrawal.totalAmount} {coinSymbol}
                            </span>
                          </td>
                        </tr>
                      )}
                      {withdrawal.amountUsd && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.amountUsd', { defaultValue: 'Amount USD' })}</td>
                          <td className="fw-medium">{formatUsd(withdrawal.amountUsd)}</td>
                        </tr>
                      )}
                      {withdrawal.usdRate && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.usdRate', { defaultValue: 'USD Rate' })}</td>
                          <td>
                            ${withdrawal.usdRate}
                            {withdrawal.rateSource && (
                              <small className="text-muted ms-2">({withdrawal.rateSource})</small>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">{t('withdrawal.decimals', { defaultValue: 'Decimals' })}</td>
                        <td>{decimals}</td>
                      </tr>
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
                    {t('withdrawal.transaction', { defaultValue: 'Transaction' })}
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('withdrawal.txHash', { defaultValue: 'Tx Hash' })}</td>
                        <td>
                          {withdrawal.txHash ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{withdrawal.txHash}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/tx/${withdrawal.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(withdrawal.txHash)}
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
                      {withdrawal.blockNumber && (
                        <tr>
                          <td className="text-muted">Block Number</td>
                          <td>{withdrawal.blockNumber}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">{t('withdrawal.fromAddress', { defaultValue: 'From Address' })}</td>
                        <td>
                          {withdrawal.fromAddress ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{withdrawal.fromAddress}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/address/${withdrawal.fromAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(withdrawal.fromAddress)}
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
                        <td className="text-muted">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</td>
                        <td>
                          {withdrawal.toAddress ? (
                            <>
                              <code className="text-break" style={{ fontSize: '0.75rem' }}>{withdrawal.toAddress}</code>
                              <div className="d-flex gap-1 mt-2">
                                {explorerUrl && (
                                  <a
                                    href={`${explorerUrl}/address/${withdrawal.toAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bx bx-link-external me-1"></i>Explorer
                                  </a>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => copyToClipboard(withdrawal.toAddress)}
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
                    {t('withdrawal.timestamps', { defaultValue: 'Timestamps' })}
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('withdrawal.createdAt', { defaultValue: 'Created' })}</td>
                        <td>{formatDate(withdrawal.createdAt)}</td>
                      </tr>
                      {withdrawal.processedAt && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.processedAt', { defaultValue: 'Processed' })}</td>
                          <td>{formatDate(withdrawal.processedAt)}</td>
                        </tr>
                      )}
                      {withdrawal.completedAt && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.completedAt', { defaultValue: 'Completed' })}</td>
                          <td>{formatDate(withdrawal.completedAt)}</td>
                        </tr>
                      )}
                      {withdrawal.failedAt && (
                        <tr>
                          <td className="text-muted text-danger">{t('withdrawal.failedAt', { defaultValue: 'Failed' })}</td>
                          <td className="text-danger">{formatDate(withdrawal.failedAt)}</td>
                        </tr>
                      )}
                      {withdrawal.updatedAt && (
                        <tr>
                          <td className="text-muted">{t('withdrawal.updatedAt', { defaultValue: 'Updated' })}</td>
                          <td>{formatDate(withdrawal.updatedAt)}</td>
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
                  {t('withdrawal.metadata', { defaultValue: 'Metadata' })}
                </h5>
              </div>
              <div className="card-body">
                <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Failure Reason */}
          {failureReason && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0 text-danger">
                  <i className="bx bx-error me-2"></i>
                  {t('withdrawal.failureReason', { defaultValue: 'Failure Reason' })}
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
