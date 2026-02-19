import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { getPublicInvoice, getPublicInvoiceQr, getPublicInvoiceStatus, getPublicPayment, getPublicPaymentStatus, selectPaymentNetwork } from '../../api/invoices'
import { formatAmount, formatDateTime } from '../../utils/format'
import { useInvoiceEvents } from '../../hooks/useInvoiceEvents'
import { playNotificationSound } from '../../utils/notification'
import { useToastContext } from '../../context/ToastContext'

// Network icon component
function NetworkIcon({ networkSymbol, size = 24 }) {
  const [idx, setIdx] = useState(0)
  const candidates = useMemo(() => {
    const sym = String(networkSymbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const aliases = {
      eth: ['ethereum'],
      bsc: ['binance', 'bnb'],
      matic: ['polygon'],
      polygon: ['polygon', 'matic'],
      arbitrum: ['arbitrum'],
      optimism: ['optimism'],
      avalanche: ['avalanche', 'avax'],
      fantom: ['fantom', 'ftm'],
      base: ['base'],
      tron: ['tron', 'trx'],
    }
    const names = [sym, ...(aliases[sym] || [])]
    const exts = ['svg', 'png']
    const byAssets = names.flatMap((n) => exts.map((ext) => `/assets/img/networks/${n}.${ext}`))
    const byCoinFallback = names.flatMap((n) => exts.map((ext) => `/assets/img/coins/${n}.${ext}`))
    const arr = [...byAssets, ...byCoinFallback, '/assets/img/coins/default.svg']
    return Array.from(new Set(arr))
  }, [networkSymbol])
  const src = candidates[Math.min(idx, candidates.length - 1)]
  return (
    <img
      src={src}
      alt={networkSymbol}
      width={size}
      height={size}
      className="rounded-circle"
      style={{ objectFit: 'cover' }}
      onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  )
}

// Coin image component
function CoinImg({ symbol, logoUrl, size = 32 }) {
  const [idx, setIdx] = useState(0)
  const candidates = useMemo(() => {
    const sym = String(symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
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
    const byAssets = names.flatMap((n) => exts.map((ext) => `/assets/img/coins/${n}.${ext}`))
    const arr = [...byAssets, ...(logoUrl ? [logoUrl] : []), '/assets/img/coins/default.svg']
    return Array.from(new Set(arr))
  }, [symbol, logoUrl])
  const src = candidates[Math.min(idx, candidates.length - 1)]
  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-circle"
      style={{ objectFit: 'cover' }}
      onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  )
}

export default function InvoicePaymentV2() {
  const { t } = useTranslation()
  const { id: publicCode } = useParams()
  const toast = useToastContext()
  const [invoice, setInvoice] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const [copiedAmt, setCopiedAmt] = useState(false)
  const pollRef = useRef(null)
  const abortRef = useRef(null)

  // Payment mode: detect pay_ prefix
  const isPaymentMode = publicCode?.startsWith('pay_')
  const [paymentData, setPaymentData] = useState(null)
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [selectingNetwork, setSelectingNetwork] = useState(false)
  const needsNetworkSelection = isPaymentMode && paymentData && !paymentData.networkSymbol
  const [redirectCountdown, setRedirectCountdown] = useState(null)

  const ACTIVE_INTERVAL = 6000

  // Map payment API data to invoice-like structure for shared UI
  const mapPaymentToInvoice = useCallback((data) => {
    return {
      id: data.paymentId,
      invoiceId: data.paymentId,
      publicCode: data.paymentId,
      status: (data.status || '').toLowerCase(),
      expiryAt: data.expiresAt,
      amount: data.amount,
      description: data.description,
      paymentAddress: data.paymentAddress || null,
      paidAt: data.paidAt,
      paidAmount: data.paidAmount,
      merchantName: data.merchantName,
      symbol: data.coinSymbol,
      coin: data.coinSymbol ? { symbol: data.coinSymbol, name: data.coinSymbol } : undefined,
      network: data.networkSymbol
        ? { symbol: data.networkSymbol, name: data.networkName || data.networkSymbol }
        : null,
      networkName: data.networkName || data.networkSymbol || '',
      successUrl: data.successUrl,
    }
  }, [])

  // Load payment data (pay_ prefix) — full load for initial, status API for polling
  const loadPayment = useCallback(async (initial = false) => {
    if (!publicCode) return
    if (initial) setLoading(true)
    setError('')
    setErrorCode('')
    try {
      if (initial) {
        const data = await getPublicPayment(publicCode)
        setPaymentData(data)
        setInvoice(mapPaymentToInvoice(data))
      } else {
        // Poll with lightweight status endpoint
        const statusData = await getPublicPaymentStatus(publicCode)
        setInvoice(prev => prev ? {
          ...prev,
          status: (statusData.status || '').toLowerCase(),
          paidAt: statusData.paidAt || prev.paidAt,
          successUrl: statusData.successUrl || prev.successUrl,
        } : prev)
        setPaymentData(prev => prev ? {
          ...prev,
          status: statusData.status,
          paidAt: statusData.paidAt,
        } : prev)
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to load payment')
    } finally {
      if (initial) setLoading(false)
    }
  }, [publicCode, mapPaymentToInvoice])

  const loadInvoice = useCallback(async (initial = false) => {
    if (!publicCode) return
    if (initial) setLoading(true)
    setError('')
    setErrorCode('')
    try {
      if (initial) {
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller
        
        const { invoice: inv, qr: qrData } = await getPublicInvoice(publicCode)
        
        const mapped = {
          id: inv.invoiceId ?? inv.id,
          invoiceId: inv.invoiceId ?? inv.id,
          publicCode: inv.publicCode,
          status: (inv.status || '').toLowerCase(),
          expiryAt: inv.expiresAt || inv.expiryAt,
          amount: qrData?.amount ?? inv.amount,
          description: inv.description,
          paymentAddress: qrData?.address || inv.paymentAddress,
          createdAt: inv.createdAt || inv.created_at,
          paidAmount: inv.paidAmount || inv.paid_amount,
          paidAt: inv.paidAt || inv.paid_at,
          decimals: inv.decimals,
          coin: inv.coin,
          network: inv.network,
          symbol: qrData?.symbol || inv.coin?.symbol || inv.symbol,
          networkName: qrData?.network || inv.network?.name || inv.network,
        }
        setInvoice(mapped)
        setQr(qrData)
      } else {
        // Poll with lightweight status endpoint
        const statusData = await getPublicInvoiceStatus(publicCode)
        setInvoice(prev => prev ? {
          ...prev,
          status: (statusData.status || '').toLowerCase(),
          paidAt: statusData.paidAt || prev.paidAt,
          paidAmount: statusData.amountReceived || prev.paidAmount,
          expiryAt: statusData.expiresAt || prev.expiryAt,
        } : prev)
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
      if (e?.code === 'BIZ_1200') {
        setErrorCode(e.code)
        setError(e.message || 'Invoice cancelled')
        setInvoice(prev => prev ? { ...prev, status: 'cancelled' } : null)
      } else {
        setError(e?.message || 'Failed to load invoice')
      }
    } finally {
      if (initial) setLoading(false)
    }
  }, [publicCode])

  useEffect(() => {
    if (isPaymentMode) {
      loadPayment(true)
    } else {
      loadInvoice(true)
    }
  }, [isPaymentMode, loadPayment, loadInvoice])

  useEffect(() => {
    if (!invoice || errorCode === 'BIZ_1200') return
    // Don't poll if we need network selection
    if (needsNetworkSelection) return
    const isPaid = invoice.status === 'paid' || invoice.status === 'completed'
    if (isPaid) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }
    const pollFn = isPaymentMode ? () => loadPayment(false) : () => loadInvoice(false)
    pollRef.current = setInterval(pollFn, ACTIVE_INTERVAL)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [invoice, loadInvoice, loadPayment, errorCode, isPaymentMode, needsNetworkSelection])

  // Subscribe to Pusher events for real-time updates
  useInvoiceEvents(invoice?.invoiceId || invoice?.id, {
    onPaymentReceived: (data) => {
      console.log('Payment received via Pusher:', data)
      playNotificationSound('success')
      // Show toast notification
      toast.success({
        title: t('payment.paymentReceived') || 'Payment Received',
        body: data.body || t('payment.completedSub') || 'Payment has been received'
      });
      // Update invoice status immediately
      setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      // Refresh invoice data in background after delay
      setTimeout(() => loadInvoice(false), 1000)
    },
    onStatusChanged: (data) => {
      console.log('Status changed via Pusher:', data)
      // Check if it's a payment completion notification
      if (data.type === 'invoice_completed' || data.status === 'paid') {
        playNotificationSound('success')
        // Show toast notification
        toast.success({
          title: t('payment.paymentReceived') || 'Invoice Paid',
          body: data.body || t('payment.completedSub') || 'Invoice has been paid successfully'
        });
        // Update invoice status immediately
        setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      } else if (data.status) {
        setInvoice(prev => prev ? { ...prev, status: data.status } : prev)
      }
      // Then refresh full data in background after delay
      setTimeout(() => loadInvoice(false), 1000)
    },
    onUpdated: (data) => {
      console.log('Invoice updated via Pusher:', data)
      // Show toast notification
      toast.info({
        title: data.title || t('payment.invoiceUpdated') || 'Invoice Updated',
        body: data.body || t('payment.invoiceUpdated') || 'Invoice has been updated'
      })
      // Refresh in background after delay
      setTimeout(() => loadInvoice(false), 1000)
    },
    onPaymentCompleted: (data) => {
      console.log('Payment completed via Pusher:', data)
      playNotificationSound('success')
      toast.success({
        title: data.title || t('payment.paymentReceived') || 'Payment Completed',
        body: data.message || t('payment.completedSub') || 'Payment has been completed successfully'
      })
      // Update invoice status immediately
      setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      // Refresh invoice data in background after delay
      setTimeout(() => loadInvoice(false), 1000)
    }
  })

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Use new coin and network objects from API response
  const coinSym = (invoice?.coin?.symbol || invoice?.symbol || qr?.symbol || '').toUpperCase()
  const networkName = invoice?.network?.name || invoice?.networkName || qr?.network || ''
  const networkSym = (invoice?.network?.symbol || '').toUpperCase()
  const explorerUrl = invoice?.network?.explorerUrl || ''
  const year = new Date().getFullYear()

  const expiryMs = useMemo(() => invoice?.expiryAt ? new Date(String(invoice.expiryAt)).getTime() : undefined, [invoice?.expiryAt])
  const remainingMs = expiryMs ? Math.max(0, expiryMs - now) : undefined
  const isExpired = expiryMs ? remainingMs === 0 : false

  const isPaid = invoice?.status === 'paid' || invoice?.status === 'completed' || (Number(invoice?.paidAmount) || 0) >= (Number(invoice?.amount) || 0)
  const hasPartial = !isPaid && (Number(invoice?.paidAmount) || 0) > 0

  const currentStep = isPaid ? 3 : hasPartial ? 2 : 1

  // Auto-redirect countdown when paid + successUrl
  const redirectTimerRef = useRef(null)
  useEffect(() => {
    if (!isPaid || !invoice?.successUrl) return
    let count = 5
    setRedirectCountdown(count)
    redirectTimerRef.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(redirectTimerRef.current)
        window.location.href = invoice.successUrl
        return
      }
      setRedirectCountdown(count)
    }, 1000)
    return () => clearInterval(redirectTimerRef.current)
  }, [isPaid, invoice?.successUrl])

  function statusClass(s) {
    const v = (s || "").toLowerCase()
    if (v === "paid") return "bg-success"
    if (v === "pending") return "bg-warning"
    if (v === "expired") return "bg-danger"
    if (v === "cancelled") return "bg-secondary"
    return "bg-secondary"
  }

  function statusLabel(s) {
    switch ((s || "").toLowerCase()) {
      case "paid":
        return t("invoices.paid")
      case "pending":
        return t("invoices.pending")
      case "expired":
        return t("invoices.expired")
      case 'cancelled':
        return t('invoices.cancelled') || 'Cancelled'
      default:
        return s || "-"
    }
  }

  const rawStatus = (invoice?.status || '').toLowerCase()
  const normalizedStatus = rawStatus === 'waiting' ? 'pending' : rawStatus === 'completed' ? 'paid' : rawStatus
  const uiStatus = errorCode === 'BIZ_1200'
    ? 'cancelled'
    : isExpired && !isPaid
      ? 'expired'
      : normalizedStatus

  const paymentValue = useMemo(() => qr?.address || invoice?.paymentAddress || '', [qr?.address, invoice?.paymentAddress])

  function formatDuration(ms) {
    if (ms === undefined) return "-"
    const total = Math.floor(ms / 1000)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n) => String(n).padStart(2, "0")
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invoice?.paymentAddress || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { }
  }

  const handleCopyAmount = async () => {
    try {
      const val = invoice?.amount != null ? String(invoice.amount) : ''
      if (!val) return
      await navigator.clipboard.writeText(val)
      setCopiedAmt(true)
      setTimeout(() => setCopiedAmt(false), 1200)
    } catch { }
  }

  const isExpiredUnpaid = isExpired && !isPaid

  // Handle network selection for payment mode
  const handleConfirmNetwork = async () => {
    if (!selectedNetwork || !publicCode) return
    setSelectingNetwork(true)
    try {
      const data = await selectPaymentNetwork(publicCode, selectedNetwork)
      // Use the response directly — it contains paymentAddress, networkSymbol etc.
      setPaymentData(data)
      setInvoice(mapPaymentToInvoice(data))
      setSelectedNetwork(null)
    } catch (e) {
      setError(e?.message || 'Failed to select network')
    } finally {
      setSelectingNetwork(false)
    }
  }

  return (
    <div className="min-vh-100 position-relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)'
    }}>
      {/* Animated Gradient Background */}
      <div className="position-absolute w-100 h-100" style={{ zIndex: 0 }}>
        <div className="position-absolute" style={{
          width: '150%',
          height: '150%',
          top: '-25%',
          left: '-25%',
          background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
          animation: 'gradientShift 15s ease infinite',
          filter: 'blur(60px)'
        }}></div>

        {/* Floating Orbs */}
        <div className="position-absolute rounded-circle" style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          top: '10%',
          right: '15%',
          filter: 'blur(40px)',
          animation: 'float 20s ease-in-out infinite'
        }}></div>
        <div className="position-absolute rounded-circle" style={{
          width: 250,
          height: 250,
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
          bottom: '15%',
          left: '10%',
          filter: 'blur(50px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* Header */}
      <div className="position-relative" style={{ zIndex: 1 }}>
        <div className="container py-2">
          <div className="d-flex justify-content-center align-items-center gap-3">
            <div className="position-relative">
              <div className="position-absolute w-100 h-100 rounded-circle" style={{
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                filter: 'blur(20px)',
                opacity: 0.6,
                animation: 'pulse 3s ease-in-out infinite'
              }}></div>
              <div className="position-relative d-flex align-items-center justify-content-center" style={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                borderRadius: 16,
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}>
                <i className="bx bx-wallet text-white" style={{ fontSize: 24 }}></i>
              </div>
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{
                fontSize: '1.25rem',
                letterSpacing: '-0.5px',
                color: '#1e293b'
              }}>BULL PAY</h2>
              <p className="mb-0" style={{
                color: '#64748b',
                fontSize: '0.75rem',
                letterSpacing: '0.5px'
              }}>Crypto Payment Gateway</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -30px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes gradientShift {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
        }
      `}</style>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex align-items-center py-2">
        <div className="container">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-white" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : errorCode === 'BIZ_1200' && !invoice ? (
            <div className="card border-0 shadow-lg mx-auto" style={{ maxWidth: 500, borderRadius: 12 }}>
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <i className="bx bx-block" style={{ fontSize: 64, color: '#6c757d' }}></i>
                </div>
                <h4 className="mb-3">{t('invoices.cancelled') || 'Cancelled'}</h4>
                <p className="text-muted">{t('payment.cancelledMessage') || 'This invoice has been cancelled.'}</p>
              </div>
            </div>
          ) : !invoice ? (
            <div className="text-center text-white">{t('invoices.notFound') || 'Not found'}</div>
          ) : (
            <div className="row justify-content-center position-relative" style={{ zIndex: 1 }}>
              <div className="col-12 col-md-8 col-lg-5">
                {/* Main Card */}
                <div className="position-relative">
                  {/* Card Glow Effect */}
                  <div className="position-absolute w-100 h-100" style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
                    borderRadius: 12,
                    filter: 'blur(30px)',
                    opacity: 0.6
                  }}></div>

                  <div className="card border-0 position-relative" style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.15)'
                  }}>
                    {/* Status Banner */}
                    <div className="position-relative overflow-hidden" style={{
                      background: uiStatus === 'paid'
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : uiStatus === 'pending'
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : uiStatus === 'expired'
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : 'linear-gradient(135deg, #6b7280, #4b5563)',
                      padding: '16px 24px'
                    }}>
                      <div className="position-absolute w-100 h-100" style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        animation: 'shimmer 3s infinite',
                        zIndex: 0,
                        top: 0,
                        left: 0
                      }}></div>
                      <div className="text-center position-relative" style={{ zIndex: 1 }}>
                        <div className="d-inline-flex align-items-center gap-2">
                          <i className={`bx ${uiStatus === 'paid' ? 'bx-check-circle' :
                              uiStatus === 'pending' ? 'bx-time-five' :
                                uiStatus === 'expired' ? 'bx-x-circle' : 'bx-info-circle'
                            } text-white`} style={{ fontSize: 20 }}></i>
                          <span className="fw-bold text-uppercase text-white" style={{
                            letterSpacing: '2px',
                            fontSize: '0.875rem'
                          }}>
                            {statusLabel(uiStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <style>{`
                      @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                      }
                    `}</style>

                    {/* Card Body */}
                    <div className="card-body p-3 p-md-4">

                      {/* ===== Network Selection UI (payment mode, no network yet) ===== */}
                      {needsNetworkSelection ? (
                        <div>
                          {/* Merchant & Payment Info */}
                          {paymentData?.merchantName && (
                            <div className="text-center mb-2">
                              <span className="small text-uppercase fw-semibold" style={{ color: '#64748b', letterSpacing: '1px', fontSize: '0.7rem' }}>
                                {t('payment.merchant', { defaultValue: 'Merchant' })}
                              </span>
                              <div className="fw-bold" style={{ fontSize: '1rem', color: '#1e293b' }}>
                                {paymentData.merchantName}
                              </div>
                            </div>
                          )}

                          {/* Amount & Coin */}
                          <div className="mb-3 p-3 rounded-3 text-center" style={{
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05))',
                            border: '1px solid rgba(139, 92, 246, 0.15)'
                          }}>
                            <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                              <CoinImg symbol={paymentData?.coinSymbol} size={40} />
                              <div>
                                <div style={{
                                  fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px',
                                  background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text', lineHeight: 1.2
                                }}>
                                  {paymentData?.amount} {paymentData?.coinSymbol}
                                </div>
                              </div>
                            </div>
                            {paymentData?.description && (
                              <div className="small" style={{ color: '#64748b' }}>{paymentData.description}</div>
                            )}
                          </div>

                          {/* Timer */}
                          {!isPaid && remainingMs !== undefined && (
                            <div className="text-center mb-3 p-2 rounded-3" style={{
                              background: remainingMs <= 60_000
                                ? 'rgba(239, 68, 68, 0.1)'
                                : remainingMs <= 5 * 60_000
                                  ? 'rgba(245, 158, 11, 0.1)'
                                  : 'rgba(139, 92, 246, 0.08)',
                              border: '1px solid rgba(139, 92, 246, 0.15)'
                            }}>
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <i className="bx bx-time" style={{ color: '#8b5cf6', fontSize: 16 }}></i>
                                <span className="small fw-semibold" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                  {t('payment.timeRemaining', { defaultValue: 'Time Remaining' })}
                                </span>
                                <span className="fw-bold" style={{
                                  color: remainingMs <= 60_000 ? '#ef4444' : '#8b5cf6',
                                  fontSize: '1.1rem', letterSpacing: '2px'
                                }}>
                                  {formatDuration(remainingMs)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Select Network Label */}
                          <div className="mb-2">
                            <span className="small text-uppercase fw-bold" style={{
                              color: '#64748b', letterSpacing: '1.5px', fontSize: '0.7rem'
                            }}>
                              {t('payment.selectNetwork', { defaultValue: 'Select Network' })}
                            </span>
                          </div>

                          {/* Network List */}
                          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                            <div className="d-flex flex-column gap-2">
                              {(paymentData?.availableNetworks || []).map((net) => {
                                const isSelected = selectedNetwork === net.networkSymbol
                                return (
                                  <div
                                    key={net.networkSymbol}
                                    className="d-flex align-items-center gap-3 p-3 rounded-3"
                                    style={{
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      background: isSelected
                                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(59, 130, 246, 0.12))'
                                        : 'rgba(255, 255, 255, 0.6)',
                                      border: isSelected
                                        ? '2px solid rgba(139, 92, 246, 0.4)'
                                        : '1px solid rgba(139, 92, 246, 0.1)',
                                      boxShadow: isSelected
                                        ? '0 4px 16px rgba(139, 92, 246, 0.15)'
                                        : '0 1px 3px rgba(0, 0, 0, 0.04)',
                                    }}
                                    onClick={() => setSelectedNetwork(net.networkSymbol)}
                                  >
                                    <NetworkIcon networkSymbol={net.networkSymbol} size={32} />
                                    <div className="flex-grow-1">
                                      <div className="fw-bold" style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                                        {net.networkName}
                                      </div>
                                      <div className="small" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                        {net.networkSymbol} · {net.confirmations} {t('payment.confirmations', { defaultValue: 'confirmations' })}
                                      </div>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                      {isSelected ? (
                                        <div className="d-flex align-items-center justify-content-center rounded-circle" style={{
                                          width: 28, height: 28,
                                          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                                        }}>
                                          <i className="bx bx-check text-white" style={{ fontSize: 18 }}></i>
                                        </div>
                                      ) : (
                                        <div className="rounded-circle" style={{
                                          width: 28, height: 28,
                                          border: '2px solid #e2e8f0'
                                        }}></div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Error */}
                          {error && (
                            <div className="alert alert-danger mt-3 mb-0 py-2 small">{error}</div>
                          )}

                          {/* Confirm Button */}
                          <div className="mt-3">
                            <button
                              className="btn w-100 py-3 fw-bold"
                              disabled={!selectedNetwork || selectingNetwork}
                              onClick={handleConfirmNetwork}
                              style={{
                                background: selectedNetwork
                                  ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)'
                                  : '#e2e8f0',
                                color: selectedNetwork ? 'white' : '#94a3b8',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: '1rem',
                                letterSpacing: '0.5px',
                                transition: 'all 0.3s ease',
                                boxShadow: selectedNetwork
                                  ? '0 8px 24px rgba(139, 92, 246, 0.4)'
                                  : 'none',
                              }}
                            >
                              {selectingNetwork ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              ) : (
                                <i className="bx bx-check-circle me-2"></i>
                              )}
                              {t('payment.confirmNetwork', { defaultValue: 'Continue with Selected Network' })}
                            </button>
                          </div>

                        </div>
                      ) : (
                      /* ===== Normal Invoice / Payment UI (network already selected) ===== */
                      <div>
                      {/* Invoice Info & Chain */}
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 gap-md-3 mb-3">
                        {/* Left - Invoice */}
                        <div className="order-1">
                          <div className="small mb-1" style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', fontWeight: '600' }}>
                            {isPaymentMode ? (t("payment.payment", { defaultValue: "Payment" })) : t("invoices.invoice")}
                          </div>
                          <div className="fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '-0.5px', color: '#1e293b' }}>
                            {isPaymentMode
                              ? (invoice.publicCode || invoice.id)
                              : `#${invoice.invoiceNumber || invoice.publicCode || invoice.id}`}
                          </div>
                        </div>
                        
                        {/* Right - Chain */}
                        <div className="order-2 text-center px-3 py-2 rounded-2" style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(59, 130, 246, 0.12))',
                          border: '1px solid rgba(139, 92, 246, 0.25)'
                        }}>
                          <div className="small mb-1" style={{ 
                            fontSize: '0.6rem', 
                            color: '#64748b',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {t("invoices.chain") || "Chain"}
                          </div>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <NetworkIcon networkSymbol={networkSym} size={24} />
                            <div className="fw-bold" style={{ 
                              fontSize: '0.9rem', 
                              color: '#8b5cf6',
                              letterSpacing: '0.5px',
                              fontWeight: '700'
                            }}>
                              {networkSym || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timer - Moved to Top */}
                      {!isPaid && remainingMs !== undefined && (
                        <div className="text-center mb-3 p-3 rounded-4" style={{
                          background: remainingMs <= 60_000
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))'
                            : remainingMs <= 5 * 60_000
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))'
                              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
                          border: remainingMs <= 60_000
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : remainingMs <= 5 * 60_000
                              ? '1px solid rgba(245, 158, 11, 0.3)'
                              : '1px solid rgba(139, 92, 246, 0.3)'
                        }}>
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                              width: 28,
                              height: 28,
                              background: remainingMs <= 60_000
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : remainingMs <= 5 * 60_000
                                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                  : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                              animation: remainingMs <= 60_000 ? 'pulse 1.5s infinite' : 'none',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}>
                              <i className="bx bx-time text-white" style={{ fontSize: 16 }}></i>
                            </div>
                            <span className="small" style={{
                              color: '#64748b',
                              textTransform: 'uppercase',
                              letterSpacing: '1.5px',
                              fontSize: '0.7rem',
                              fontWeight: '700'
                            }}>
                              {t("payment.timeRemaining")}
                            </span>
                          </div>
                          <div
                            style={{
                              color: remainingMs <= 60_000 ? '#ff4500' : remainingMs <= 5 * 60_000 ? '#ff6b35' : '#ff8c42',
                              fontWeight: '900',
                              fontSize: '2.25rem',
                              letterSpacing: '5px'
                            }}
                          >
                            {formatDuration(remainingMs)}
                          </div>
                        </div>
                      )}

                      {/* QR Code & Amount Section */}
                      {!isExpiredUnpaid && (
                        <div className="mb-3 p-4 rounded-4" style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05))',
                          border: '1px solid rgba(139, 92, 246, 0.15)'
                        }}>
                          <div className="row g-4 align-items-center">
                            {/* QR Code - Left Side (hidden when paid) */}
                            {!isPaid && (
                            <div className="col-12 col-md-6 text-center">
                              <div className="d-inline-block position-relative">
                                <div className="position-relative p-3 rounded-4" style={{
                                  background: 'white',
                                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
                                  border: '2px solid rgba(139, 92, 246, 0.15)'
                                }}>
                                  <QRCode 
                                    value={paymentValue} 
                                    size={160} 
                                    includeMargin={false}
                                    level="H"
                                  />
                                  {/* Overlay coin icon */}
                                  <div className="position-absolute top-50 start-50 translate-middle" style={{
                                    background: 'white',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={28} />
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{
                                background: 'rgba(139, 92, 246, 0.1)',
                                border: '1px solid rgba(139, 92, 246, 0.2)'
                              }}>
                                <i className="bx bx-qr-scan" style={{ color: '#8b5cf6', fontSize: '0.9rem' }}></i>
                                <span className="small fw-semibold" style={{ color: '#1e293b', fontSize: '0.75rem' }}>
                                  {t("payment.scanToPay") || "Scan to pay"}
                                </span>
                              </div>
                            </div>
                            )}

                            {/* Amount */}
                            <div className={`${isPaid ? 'col-12' : 'col-12 col-md-6'} text-center`}>
                              <div className="small mb-3" style={{
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                fontSize: '0.7rem',
                                fontWeight: '700'
                              }}>{t("invoices.amount")}</div>
                              
                              {/* Amount Card with Coin Info */}
                              <div className="p-4 rounded-3" style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))',
                                border: '2px solid rgba(139, 92, 246, 0.2)',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)'
                              }}>
                                {/* Coin Icon and Name */}
                                <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                                  <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={48} />
                                  <div className="text-start">
                                    <div style={{
                                      fontSize: '1.25rem',
                                      fontWeight: '800',
                                      color: '#1e293b',
                                      letterSpacing: '0.5px',
                                      lineHeight: 1.2
                                    }}>{coinSym}</div>
                                    <div style={{
                                      fontSize: '0.85rem',
                                      color: '#64748b',
                                      fontWeight: '600'
                                    }}>{invoice?.coin?.name || coinSym}</div>
                                  </div>
                                </div>

                                {/* Amount Value */}
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  <div style={{
                                    fontSize: '2.5rem',
                                    fontWeight: '900',
                                    letterSpacing: '-2px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    lineHeight: 1.1,
                                    color: '#1e293b'
                                  }}>
                                    {formatAmount(invoice.amount)}
                                  </div>
                                  {invoice.amount != null && !isPaid && (
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      style={{
                                        background: copiedAmt
                                          ? 'linear-gradient(135deg, #10b981, #059669)'
                                          : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: 6,
                                        padding: '6px 8px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        boxShadow: copiedAmt
                                          ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                                          : '0 2px 8px rgba(139, 92, 246, 0.3)',
                                        transform: copiedAmt ? 'scale(1.05)' : 'scale(1)'
                                      }}
                                      onClick={handleCopyAmount}
                                      title={copiedAmt ? t("actions.copied") : t("actions.copyAmount", { defaultValue: "Copy Amount" })}
                                    >
                                      <i className={`bx ${copiedAmt ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: '0.9rem' }}></i>
                                    </button>
                                  )}
                                </div>

                                {/* Network Info */}
                                <div className="mt-2" style={{
                                  color: '#64748b',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}>
                                  on {networkName || 'Network'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <style>{`
                        @keyframes pulse {
                          0%, 100% { opacity: 1; transform: scale(1); }
                          50% { opacity: 0.6; transform: scale(1.05); }
                        }
                      `}</style>

                      {/* Expired Alert */}
                      {isExpiredUnpaid && (
                        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                          <i className="bx bx-error-circle me-2 fs-4"></i>
                          <div>
                            {t("payment.expiredMessage") || "This invoice has expired. Please request a new payment link."}
                          </div>
                        </div>
                      )}

                      {/* Payment Address */}
                      {!isExpiredUnpaid && !isPaid && (
                        <div className="mb-3">
                          <div className="small mb-2" style={{
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>
                            {t("invoices.paymentAddress")}
                          </div>
                          <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{
                            background: 'rgba(139, 92, 246, 0.05)',
                            border: '1px solid rgba(139, 92, 246, 0.15)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                          }}>
                            <code className="flex-grow-1 text-break mb-0 fw-medium" style={{
                              fontSize: '0.75rem',
                              color: '#6366f1',
                              background: 'none'
                            }}>
                              {invoice.paymentAddress || '-'}
                            </code>
                            {invoice.paymentAddress && (
                              <button
                                type="button"
                                className="btn btn-sm flex-shrink-0"
                                style={{
                                  background: copied
                                    ? 'linear-gradient(135deg, #10b981, #059669)'
                                    : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                  border: 'none',
                                  color: 'white',
                                  borderRadius: 8,
                                  width: 36,
                                  height: 36,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.3s ease',
                                  boxShadow: copied
                                    ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                    : '0 4px 12px rgba(139, 92, 246, 0.4)',
                                  transform: copied ? 'scale(1.1)' : 'scale(1)'
                                }}
                                onClick={handleCopy}
                              >
                                <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: 18 }}></i>
                              </button>
                            )}
                          </div>
                        </div>
                      )}


                      {/* Description */}
                      {invoice.description && (
                        <div className="mb-3 p-2 rounded-3" style={{
                          background: 'rgba(139, 92, 246, 0.03)',
                          border: '1px solid rgba(139, 92, 246, 0.1)'
                        }}>
                          <div className="small mb-2" style={{
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>{t("invoices.description")}</div>
                          <div style={{ color: '#475569', lineHeight: 1.4, fontSize: '0.875rem' }}>{invoice.description}</div>
                        </div>
                      )}

                      {/* Paid At Info */}
                      {isPaid && invoice.paidAt && (
                        <div className="mb-3 p-3 rounded-4" style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.08))',
                          border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                              width: 28,
                              height: 28,
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}>
                              <i className="bx bx-check text-white" style={{ fontSize: 16 }}></i>
                            </div>
                            <span className="small" style={{
                              color: '#047857',
                              textTransform: 'uppercase',
                              letterSpacing: '1.5px',
                              fontSize: '0.7rem',
                              fontWeight: '700'
                            }}>
                              {t("payment.paidAt", { defaultValue: "Paid At" })}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <div className="fw-bold" style={{
                              color: '#059669',
                              fontSize: '1.1rem',
                              letterSpacing: '0.5px'
                            }}>
                              {(() => {
                                const d = new Date(invoice.paidAt)
                                return new Intl.DateTimeFormat(undefined, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }).format(d)
                              })()}
                            </div>
                            <div className="fw-semibold" style={{
                              color: '#10b981',
                              fontSize: '0.9rem',
                              letterSpacing: '1px'
                            }}>
                              {(() => {
                                const d = new Date(invoice.paidAt)
                                return new Intl.DateTimeFormat(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                }).format(d)
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress Steps */}
                      <div className="mt-3 p-3 rounded-4" style={{
                        background: 'rgba(139, 92, 246, 0.03)',
                        border: '1px solid rgba(139, 92, 246, 0.1)'
                      }}>
                        <div className="d-flex justify-content-between position-relative">
                          {/* Progress Line */}
                          <div
                            className="position-absolute top-0 start-0 h-100"
                            style={{
                              width: '100%',
                              zIndex: 0,
                              marginTop: 19
                            }}
                          >
                            <div
                              className="position-relative"
                              style={{
                                height: 3,
                                background: '#e5e7eb',
                                marginLeft: 20,
                                marginRight: 20,
                                borderRadius: 10,
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                className="position-absolute h-100"
                                style={{
                                  width: isPaid ? '100%' : currentStep >= 2 ? '50%' : '0%',
                                  background: isPaid ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                                  transition: 'width 0.5s ease',
                                  left: 0,
                                  top: 0
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Step 1 */}
                          <div className="text-center" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                            <div
                              className="d-inline-flex align-items-center justify-content-center rounded-circle"
                              style={{
                                width: 40,
                                height: 40,
                                background: isPaid
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                  : currentStep >= 1
                                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                    : '#f3f4f6',
                                boxShadow: (isPaid || currentStep >= 1) ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <i className={`bx bx-coin-stack ${isPaid || currentStep >= 1 ? 'text-white' : 'text-muted'}`} style={{ fontSize: 20 }}></i>
                            </div>
                            <div className="mt-1" style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: isPaid ? '#10b981' : currentStep === 1 ? '#6366f1' : '#94a3b8'
                            }}>
                              {t("payment.waiting") || "Waiting"}
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="text-center" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                            <div
                              className="d-inline-flex align-items-center justify-content-center rounded-circle"
                              style={{
                                width: 36,
                                height: 36,
                                background: isExpiredUnpaid
                                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                  : isPaid
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : currentStep >= 2
                                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                      : '#f3f4f6',
                                boxShadow: (isExpiredUnpaid || isPaid || currentStep >= 2) ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <i
                                className={`bx ${isExpiredUnpaid
                                    ? 'bx-calendar-x text-white'
                                    : isPaid || currentStep >= 2
                                      ? 'bx-time-five text-white'
                                      : 'bx-time-five text-muted'
                                  }`}
                                style={{ fontSize: 20 }}
                              ></i>
                            </div>
                            <div className="mt-1" style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: isExpiredUnpaid ? '#ef4444' : isPaid ? '#10b981' : currentStep === 2 ? '#6366f1' : '#94a3b8'
                            }}>
                              {isExpiredUnpaid ? t('payment.expired') || 'Expired' : t("payment.processing") || "Processing"}
                            </div>
                          </div>

                          {/* Step 3 */}
                          {!isExpiredUnpaid && (
                            <div className="text-center" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                              <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                  width: 40,
                                  height: 40,
                                  background: isPaid
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : '#f3f4f6',
                                  boxShadow: isPaid ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                                  transition: 'all 0.3s ease',
                                  animation: isPaid ? 'bounce 0.6s ease' : 'none'
                                }}
                              >
                                <i className={`bx ${isPaid ? 'bx-badge-check text-white' : 'bx-like text-muted'}`} style={{ fontSize: 20 }}></i>
                              </div>
                              <div className="mt-1" style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: isPaid ? '#10b981' : '#94a3b8'
                              }}>
                                {t('payment.completed') || 'Success!'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <style>{`
                        @keyframes bounce {
                          0%, 100% { transform: scale(1); }
                          50% { transform: scale(1.1); }
                        }
                      `}</style>

                      {/* Success Redirect Button with Countdown */}
                      {isPaid && invoice?.successUrl && (
                        <div className="mt-3">
                          <a
                            href={invoice.successUrl}
                            className="btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 12,
                              fontSize: '1rem',
                              letterSpacing: '0.5px',
                              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                              textDecoration: 'none',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <i className="bx bx-check-circle" style={{ fontSize: 20 }}></i>
                            {redirectCountdown != null
                              ? `${t('payment.backToMerchant', { defaultValue: 'Redirecting' })} (${redirectCountdown}s)`
                              : t('payment.backToMerchant', { defaultValue: 'Continue' })}
                          </a>
                        </div>
                      )}
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-2 position-relative" style={{ zIndex: 1 }}>
        <div className="container text-center">
          <div className="mb-2" style={{
            color: '#94a3b8',
            fontSize: '0.75rem',
            letterSpacing: '1px',
            fontWeight: '600'
          }}>{t("common.poweredBy", { defaultValue: "Powered by" })}</div>
          <div className="mb-2" style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '1px'
          }}>BULL PAY</div>
          <div style={{
            color: '#94a3b8',
            fontSize: '0.75rem'
          }}>{t("common.copyright", { year }) || `© ${year} · All rights reserved`}</div>
        </div>
      </footer>
    </div>
  )
}
