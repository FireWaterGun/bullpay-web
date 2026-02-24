import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getTempWallet } from '../../api/admin.ts'
import { formatDate } from '../../utils/format'
import { copyToClipboard as copyText } from '../../utils/clipboard'

function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'active' || v === 'pooled') return 'badge bg-label-success'
  if (v === 'assigned') return 'badge bg-label-info'
  if (v === 'used' || v === 'sweeped') return 'badge bg-label-warning'
  if (v === 'expired' || v === 'disabled') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}

export default function TempWalletDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)

  useEffect(() => { loadWallet() }, [id])

  async function loadWallet() {
    try {
      setLoading(true)
      const data = await getTempWallet(token, id)
      setWallet(data)
    } catch (error) {
      console.error('Failed to load temp wallet:', error)
      toast.error('Failed to load temp wallet')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
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

  if (!wallet) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">Temp wallet not found</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/admin/temp-wallets')}>
            <i className="bx bx-arrow-back me-2"></i>Back to Temp Wallets
          </button>

          {/* Header Card */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet me-2"></i>
                    Temp Wallet #{wallet.id}
                  </h4>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className={statusBadgeClass(wallet.status)}>
                      {String(wallet.status || '').toUpperCase()}
                    </span>
                    {wallet.isExpired && (
                      <span className="badge bg-label-danger">EXPIRED</span>
                    )}
                    {wallet.coinNetworkId && (
                      <span className="badge bg-label-secondary">CN #{wallet.coinNetworkId}</span>
                    )}
                    {wallet.invoiceId && (
                      <span className="badge bg-label-secondary">Invoice #{wallet.invoiceId}</span>
                    )}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-info"
                    onClick={() => navigate(`/admin/temp-wallet-histories?tempWalletId=${wallet.id}`)}
                  >
                    <i className="bx bx-history me-1"></i>
                    View Histories
                  </button>
                  <button className="btn btn-primary" onClick={loadWallet} disabled={loading}>
                    <i className="bx bx-refresh me-1"></i>Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Wallet Info */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-detail me-2"></i>Wallet Details</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{wallet.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Status</td>
                        <td>
                          <span className={statusBadgeClass(wallet.status)}>
                            {String(wallet.status || '').toUpperCase()}
                          </span>
                          {wallet.isExpired && (
                            <span className="badge bg-label-danger ms-1">EXPIRED</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice ID</td>
                        <td>
                          {wallet.invoiceId ? (
                            <a
                              href="#"
                              className="fw-medium text-primary"
                              onClick={(e) => { e.preventDefault(); navigate(`/admin/invoices/${wallet.invoiceId}`) }}
                            >
                              {wallet.invoiceId}
                            </a>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">User ID</td>
                        <td className="fw-medium">{wallet.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Coin Network ID</td>
                        <td className="fw-medium">{wallet.coinNetworkId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Address</td>
                        <td>
                          {wallet.address ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {wallet.address}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(wallet.address)}
                                title="Copy"
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                      {wallet.publicKey && (
                        <tr>
                          <td className="text-muted">Public Key</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                {wallet.publicKey}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(wallet.publicKey)}
                                title="Copy"
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Reuse Count</td>
                        <td className="fw-medium">{wallet.reuseCount ?? 0}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Received (Raw)</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{wallet.totalReceivedRaw || '0'}</code></td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Swept (Raw)</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{wallet.totalSweptRaw || '0'}</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-md-6">
              {/* Key & Provider */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-key me-2"></i>Key & Provider</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>Sign Provider ID</td>
                        <td className="fw-medium">{wallet.signProviderId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Provider Key Ref</td>
                        <td className="fw-medium">{wallet.providerKeyRef || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Derivation Path</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{wallet.derivationPath || '-'}</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Flags */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-flag me-2"></i>Flags</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2">
                    {wallet.isAssigned && <span className="badge bg-label-info">Assigned</span>}
                    {wallet.isAvailable && <span className="badge bg-label-success">Available</span>}
                    {wallet.isExpired && <span className="badge bg-label-danger">Expired</span>}
                    {wallet.hasBeenUsed && <span className="badge bg-label-warning">Has Been Used</span>}
                    {wallet.needsSweeping && <span className="badge bg-label-primary">Needs Sweeping</span>}
                    {wallet.shouldBeReleased && <span className="badge bg-label-secondary">Should Be Released</span>}
                    {wallet.isReusable && <span className="badge bg-label-success">Reusable</span>}
                    {!wallet.isAssigned && !wallet.isAvailable && !wallet.isExpired && !wallet.hasBeenUsed && !wallet.needsSweeping && !wallet.shouldBeReleased && !wallet.isReusable && (
                      <span className="text-muted">No flags set</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-time-five me-2"></i>Timestamps</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>Created</td>
                        <td>{formatDate(wallet.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Updated</td>
                        <td>{formatDate(wallet.updatedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Expires</td>
                        <td>{formatDate(wallet.expiresAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">First Used</td>
                        <td>{formatDate(wallet.firstUsedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Assigned</td>
                        <td>{formatDate(wallet.lastAssignedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Released</td>
                        <td>{formatDate(wallet.lastReleasedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Checked</td>
                        <td>{formatDate(wallet.lastCheckedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Last Sweep</td>
                        <td>{formatDate(wallet.lastSweepAt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sweep Info */}
              {(wallet.lastSweepTxHash || wallet.lastSweepAmountRaw || wallet.lastTxHash || wallet.lastBlockNumber) && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0"><i className="bx bx-transfer me-2"></i>Sweep Info</h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-borderless mb-0">
                      <tbody>
                        {wallet.lastSweepTxHash && (
                          <tr>
                            <td className="text-muted" style={{ width: '40%' }}>Sweep Tx Hash</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <code className="text-body me-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                  {wallet.lastSweepTxHash}
                                </code>
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                  onClick={() => handleCopy(wallet.lastSweepTxHash)}
                                  title="Copy"
                                >
                                  <i className="bx bx-copy"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {wallet.lastSweepAmountRaw && (
                          <tr>
                            <td className="text-muted">Sweep Amount (Raw)</td>
                            <td><code style={{ fontSize: '0.8rem' }}>{wallet.lastSweepAmountRaw}</code></td>
                          </tr>
                        )}
                        {wallet.lastTxHash && (
                          <tr>
                            <td className="text-muted">Last Tx Hash</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <code className="text-body me-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                  {wallet.lastTxHash}
                                </code>
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                  onClick={() => handleCopy(wallet.lastTxHash)}
                                  title="Copy"
                                >
                                  <i className="bx bx-copy"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {wallet.lastBlockNumber && (
                          <tr>
                            <td className="text-muted">Last Block Number</td>
                            <td className="fw-medium">{wallet.lastBlockNumber}</td>
                          </tr>
                        )}
                        {wallet.lastLeftoverTokenRaw && (
                          <tr>
                            <td className="text-muted">Leftover Token (Raw)</td>
                            <td><code style={{ fontSize: '0.8rem' }}>{wallet.lastLeftoverTokenRaw}</code></td>
                          </tr>
                        )}
                        {wallet.lastLeftoverNativeRaw && (
                          <tr>
                            <td className="text-muted">Leftover Native (Raw)</td>
                            <td><code style={{ fontSize: '0.8rem' }}>{wallet.lastLeftoverNativeRaw}</code></td>
                          </tr>
                        )}
                        {wallet.lastReason && (
                          <tr>
                            <td className="text-muted">Last Reason</td>
                            <td>{wallet.lastReason}</td>
                          </tr>
                        )}
                        {wallet.lastSource && (
                          <tr>
                            <td className="text-muted">Last Source</td>
                            <td>{wallet.lastSource}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {wallet.metadata && Object.keys(wallet.metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0"><i className="bx bx-code-alt me-2"></i>Metadata</h5>
                  </div>
                  <div className="card-body">
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem', maxHeight: 300, overflow: 'auto' }}>
                      {JSON.stringify(wallet.metadata, null, 2)}
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
