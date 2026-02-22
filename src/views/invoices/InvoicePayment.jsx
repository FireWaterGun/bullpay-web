import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPublicInvoiceQr, getPublicInvoiceStatus } from '../../api/invoices'
import { useInvoiceEvents } from '../../hooks/useInvoiceEvents'
import { playNotificationSound } from '../../utils/notification'
import { useToastContext } from '../../context/ToastContext'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard } from '../../utils/clipboard'
import PaymentProgressCard from './PaymentProgressCard'
import PaymentDetailsSection from './PaymentDetailsSection'
import PaymentQRCode from './PaymentQRCode'

export default function InvoicePayment() {
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
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const pollRef = useRef(null)
  const abortRef = useRef(null)

  const ACTIVE_INTERVAL = 6000

  const loadInvoice = useCallback(async (initial = false) => {
    if (!publicCode) return
    if (initial) setLoading(true)
  setError('')
  setErrorCode('')
    try {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const { invoice: inv, qr: qrData } = await getPublicInvoiceQr(publicCode)
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
        symbol: qrData?.symbol || inv.symbol,
        network: qrData?.network || inv.network,
      }
      setInvoice(mapped)
      setQr(qrData)
    } catch (e) {
      if (e?.name === 'AbortError') return
      if (e?.code === 'BIZ_1200') {
        setErrorCode(e.code)
        setError(t('payment.cancelledMessage') || 'Invoice cancelled')
      } else {
        setError(typeof e?.message === 'string' ? e.message : t('invoices.loadFailed') || 'Failed to load invoice')
      }
    } finally {
      if (initial) setLoading(false)
    }
  }, [publicCode, t])

  const isExpiredRef = useCallback((inv) => {
    if (!inv?.expiryAt) return false
    const ms = new Date(inv.expiryAt).getTime() - Date.now()
    return ms <= 0
  }, [])

  const refreshStatus = useCallback(async () => {
    if (!publicCode || !invoice) return
    try {
      const { invoice: inv } = await getPublicInvoiceStatus(publicCode)
      if (!inv) return
      setInvoice(prev => {
        if (!prev) return prev
        return {
          ...prev,
          status: (inv.status || prev.status || '').toLowerCase(),
          paidAmount: inv.paidAmount || inv.paid_amount || prev.paidAmount,
          expiryAt: inv.expiresAt || inv.expiryAt || prev.expiryAt,
        }
      })
    } catch (e) {
      if (e?.code === 'BIZ_1200') {
        setInvoice(prev => prev ? { ...prev, status: 'cancelled' } : prev)
        setErrorCode(e.code)
        setError(t('payment.cancelledMessage') || 'Invoice cancelled')
      }
      return
    }
  }, [publicCode, invoice])

  useInvoiceEvents(invoice?.invoiceId || invoice?.id, {
    onPaymentReceived: (data) => {
      playNotificationSound('success')
      toast.success({
        title: 'Payment Received',
        body: data.body || 'Payment has been received'
      });
      setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      setTimeout(() => refreshStatus(), 1000)
    },
    onStatusChanged: (data) => {
      if (data.type === 'invoice_completed' || data.status === 'paid') {
        playNotificationSound('success')
        toast.success({
          title: 'Invoice Paid',
          body: data.body || 'Invoice has been paid successfully'
        });
        setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      } else if (data.status) {
        setInvoice(prev => prev ? { ...prev, status: data.status } : prev)
      }
      setTimeout(() => refreshStatus(), 1000)
    },
    onUpdated: (data) => {
      toast.info({
        title: data.title || 'Invoice Updated',
        body: data.body || 'Invoice has been updated'
      })
      setTimeout(() => refreshStatus(), 1000)
    },
    onPaymentCompleted: (data) => {
      playNotificationSound('success')
      toast.success({
        title: data.title || 'Payment Completed',
        body: data.message || 'Payment has been completed successfully'
      })
      setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      setTimeout(() => refreshStatus(), 1000)
    }
  })

  useEffect(() => {
    loadInvoice(true)
  }, [loadInvoice])

  useEffect(() => {
    if (!invoice) return
    const paid = invoice.status === 'paid'
    const expired = isExpiredRef(invoice)
    if (paid || expired) return
    pollRef.current = setTimeout(() => refreshStatus(), ACTIVE_INTERVAL)
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [invoice, refreshStatus, isExpiredRef])

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth || 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cn = invoice?.coinNetwork
  const coinSym = invoice?.symbol || qr?.symbol || cn?.coin?.symbol || cn?.symbol || ''
  const networkName = invoice?.network || qr?.network || cn?.network?.name || cn?.network || cn?.name || ''
  const year = new Date().getFullYear();

  const expiryMs = useMemo(() => invoice?.expiryAt ? new Date(String(invoice.expiryAt)).getTime() : undefined, [invoice?.expiryAt])
  const remainingMs = expiryMs ? Math.max(0, expiryMs - now) : undefined;
  const isExpired = expiryMs ? remainingMs === 0 : false;

  const isPaid = invoice?.status === 'paid' || (Number(invoice?.paidAmount) || 0) >= (Number(invoice?.amount) || 0)
  const hasPartial = !isPaid && (Number(invoice?.paidAmount) || 0) > 0;

  const currentStep = isPaid ? 3 : hasPartial ? 2 : 1;

  function statusClass(s) {
    const v = (s || "").toLowerCase();
    if (v === "paid") return "bg-label-success";
    if (v === "pending") return "bg-label-warning";
    if (v === "expired") return "bg-label-danger";
    if (v === "cancelled") return "bg-label-secondary";
    return "bg-label-secondary";
  }

  function statusLabel(s) {
    switch ((s || "").toLowerCase()) {
      case "paid":
        return t("invoices.paid");
      case "pending":
        return t("invoices.pending");
      case "expired":
        return t("invoices.expired");
      case 'cancelled':
        return t('invoices.cancelled') || 'Cancelled'
      default:
        return s || "-";
    }
  }

  const uiStatus = errorCode === 'BIZ_1200'
    ? 'cancelled'
    : (isExpired && !isPaid ? 'expired' : (invoice?.status || '').toLowerCase());

  const paymentValue = useMemo(() => qr?.address || '', [qr?.address])

  function formatDuration(ms) {
    if (ms === undefined) return "-";
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  const countdownBadgeClass = useMemo(() => {
    if (remainingMs == null) return 'bg-label-secondary';
    if (remainingMs <= 60_000) return 'bg-label-danger';
    if (remainingMs <= 5 * 60_000) return 'bg-label-warning';
    return 'bg-label-info';
  }, [remainingMs]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(invoice?.paymentAddress || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  const handleCopyAmount = async () => {
    try {
      const val = invoice?.amount != null ? String(invoice.amount) : ''
      if (!val) return
      await copyToClipboard(val)
      setCopiedAmt(true)
      setTimeout(() => setCopiedAmt(false), 1200)
    } catch {}
  }

  const qrcodeSize = vw < 576 ? 168 : vw < 768 ? 192 : 208
  const isExpiredUnpaid = isExpired && !isPaid

  return (
    <div className="content-wrapper d-flex flex-column min-vh-100">
      <div className="container-xxl container-p-y flex-grow-1">
  {error && errorCode !== 'BIZ_1200' && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <div className="card">
            <div className="card-body">
              <div className="placeholder-glow">
                <span className="placeholder col-6"></span>
                <span className="placeholder col-4"></span>
                <span className="placeholder col-8"></span>
              </div>
            </div>
          </div>
        ) : errorCode === 'BIZ_1200' && !invoice ? (
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-xl-4">
              <div className="card border-secondary">
                <div className="card-body text-center">
                  <i className="bx bx-block text-secondary mb-2" style={{ fontSize: 48 }}></i>
                  <h5 className="mb-2">{t('invoices.cancelled') || 'Cancelled'}</h5>
                  <p className="text-muted mb-3 small">{t('payment.cancelledMessage') || 'This invoice has been cancelled.'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : !invoice ? (
          <div className="text-muted">{t('invoices.notFound') || 'Not found'}</div>
        ) : (
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-xl-4">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex flex-column gap-1">
                      <small className="text-muted">
                        {t('invoices.invoice')} #{invoice.invoiceNumber || invoice.publicCode || invoice.id}
                      </small>
                      <span
                        className={`badge rounded-pill text-capitalize ${statusClass(uiStatus)}`}
                        style={{ width: 'fit-content' }}
                      >
                        {statusLabel(uiStatus)}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <CoinImg symbol={coinSym} logoUrl={cn?.coin?.logoUrl} size={40} imgClassName="rounded" />
                      <div className="text-start">
                        <div className="fw-semibold">{coinSym}</div>
                        <div className="small text-muted">{networkName || 'Network'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {isExpired && !isPaid && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bx bx-error-circle me-2"></i>
                      <div>
                        {t("payment.expiredMessage") ||
                          "This invoice has expired. Please request a new payment link."}
                      </div>
                    </div>
                  )}
                  <div className="row g-3 g-md-4">
                    <PaymentQRCode
                      isExpired={isExpired}
                      isPaid={isPaid}
                      paymentValue={paymentValue}
                      qrcodeSize={qrcodeSize}
                    />
                    <PaymentDetailsSection
                      invoice={invoice}
                      coinSym={coinSym}
                      isPaid={isPaid}
                      isExpired={isExpired}
                      expiryMs={expiryMs}
                      remainingMs={remainingMs}
                      countdownBadgeClass={countdownBadgeClass}
                      copied={copied}
                      copiedAmt={copiedAmt}
                      onCopyAddress={handleCopy}
                      onCopyAmount={handleCopyAmount}
                      formatDuration={formatDuration}
                    />
                  </div>
                </div>
              </div>
              <PaymentProgressCard
                isPaid={isPaid}
                isExpiredUnpaid={isExpiredUnpaid}
                currentStep={currentStep}
              />
            </div>
          </div>
        )}
      </div>
      <footer className="mt-auto border-top">
        <div className="container-xxl text-center pt-3">
      <div className="small text-muted">Powered by BULL PAY</div>
      <div className="small text-muted">{(t("common.copyright", { year }) ||
        `© ${year} · All rights reserved`)}</div>
        </div>
      </footer>
    </div>
  );
}
