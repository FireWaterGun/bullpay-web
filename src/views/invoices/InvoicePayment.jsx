import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { getPublicInvoiceQr, getPublicInvoiceStatus } from '../../api/invoices'
import { formatAmount, formatDateTime } from '../../utils/format'

export default function InvoicePayment() {
  const { t } = useTranslation()
  const { id: publicCode } = useParams() // route param is public invoice code
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

  // Poll interval (ms) - slower after paid/expired
  const ACTIVE_INTERVAL = 6000 // faster for responsive status
  const IDLE_INTERVAL = 20000 // (reserved if want slower after paid)

  const loadInvoice = useCallback(async (initial = false) => {
    if (!publicCode) return
    if (initial) setLoading(true)
  setError('')
  setErrorCode('')
    try {
      // Cancel any in-flight
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const { invoice: inv, qr: qrData } = await getPublicInvoiceQr(publicCode)
      // Map API fields to local shape expectations
      // API gives: invoice.invoiceId, invoice.publicCode, invoice.status, invoice.expiresAt
      // qr has: address, amount, expiresAt, raw
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
      if (e?.code === 'BIZ_1200') { // cancelled
        setErrorCode(e.code)
        setError(t('payment.cancelledMessage') || 'Invoice cancelled')
      } else {
        setError(typeof e?.message === 'string' ? e.message : t('invoices.loadFailed') || 'Failed to load invoice')
      }
    } finally {
      if (initial) setLoading(false)
    }
  }, [publicCode, t])

  // Helper to compute expiry lazily for polling decision (must be before effect that uses it)
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

  // Initial load + polling
  useEffect(() => {
    loadInvoice(true)
  }, [loadInvoice])

  useEffect(() => {
    // adaptive polling (status only after first full QR load)
    if (!invoice) return
    const paid = invoice.status === 'paid'
    const expired = isExpiredRef(invoice)
    if (paid || expired) return
    pollRef.current = setTimeout(() => refreshStatus(), ACTIVE_INTERVAL)
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [invoice, refreshStatus, isExpiredRef])

  // Tick every second for countdown
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Track viewport for responsive QR size
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth || 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cn = invoice?.coinNetwork
  const coinSym = invoice?.symbol || qr?.symbol || cn?.coin?.symbol || cn?.symbol || ''
  const networkName = invoice?.network || qr?.network || cn?.network?.name || cn?.network || cn?.name || ''
  const explorer = cn?.network?.explorerUrl || cn?.explorerUrl || ''
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

  // Prefer UI-derived status over raw API status for display
  const uiStatus = errorCode === 'BIZ_1200'
    ? 'cancelled'
    : (isExpired && !isPaid ? 'expired' : (invoice?.status || '').toLowerCase());

  // QR code must use only the public payment address (qr.address) per requirement
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invoice?.paymentAddress || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  const handleCopyAmount = async () => {
    try {
      const val = invoice?.amount != null ? String(invoice.amount) : ''
      if (!val) return
      await navigator.clipboard.writeText(val)
      setCopiedAmt(true)
      setTimeout(() => setCopiedAmt(false), 1200)
    } catch {}
  }

  const qrcodeSize = vw < 576 ? 168 : vw < 768 ? 192 : 208
  const expiredIconSize = Math.min(qrcodeSize, 96)
  const isExpiredUnpaid = isExpired && !isPaid

  // Progress and share removed to revert to previous layout

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
                <div className="card-header d-flex flex-column align-items-center text-center gap-1">
                  <h5 className="mb-0">
                    {t("payment.title") || "Invoice Payment"}
                  </h5>
                  <small className="text-muted">
                    {t('invoices.invoice')} #{invoice.invoiceNumber || invoice.publicCode || invoice.id}
                  </small>
                  <span
                    className={`badge rounded-pill text-capitalize mt-1 ${statusClass(
                      uiStatus
                    )}`}
                  >
                    {statusLabel(uiStatus)}
                  </span>
                  <div className="small text-muted">
                    {formatAmount(invoice.amount)} {coinSym} {networkName && <>• {networkName}</>}
                  </div>
                </div>
                <div className="card-body">
                  {isExpired && !isPaid && (
                    <div
                      className="alert alert-danger d-flex align-items-center"
                      role="alert"
                    >
                      <i className="bx bx-error-circle me-2"></i>
                      <div>
                        {t("payment.expiredMessage") ||
                          "This invoice has expired. Please request a new payment link."}
                      </div>
                    </div>
                  )}
                  <div className="row g-3 g-md-4">
                    <div className="col-12 d-flex justify-content-center">
                      {isExpired && !isPaid ? (
                        <div className="text-center"></div>
                      ) : (
                        <div className="text-center">
                          <QRCode value={paymentValue} size={qrcodeSize} includeMargin={true} />
                          <div className="mt-2 small text-muted">
                            {t("payment.scanToPay") || "Scan to pay"}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      {!isExpired || isPaid ? (
                        <div className="mb-3">
                          <div className="text-muted small">
                            {t("invoices.amount")}
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <div className="fs-5 fw-medium">
                              {formatAmount(invoice.amount)} {coinSym}
                            </div>
                            {invoice.amount != null && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={handleCopyAmount}
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            )}
                            {copiedAmt && (
                              <span className="badge bg-label-success">
                                {t("actions.copy") || "Copy"}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}
                      {!isExpired || isPaid ? (
                        <div className="mb-3">
                          <div className="text-muted small">
                            {t("invoices.paymentAddress")}
                          </div>
                          <div className="d-flex align-items-center flex-wrap gap-2">
                            <code className="text-break text-body">
                              {invoice.paymentAddress || '-'}
                            </code>
                            {invoice.paymentAddress && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={handleCopy}
                                >
                                  <i className="bx bx-copy"></i>
                                </button>
                                {copied && (
                                  <span className="badge bg-label-success">
                                    {t("actions.copy") || "Copy"}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ) : null}
                      {!isPaid && (
                        <div className="mb-3">
                          <div className="text-muted small">
                            {t("payment.timeRemaining")}
                          </div>
                          {expiryMs ? (
                            <div
                              className={`fw-medium ${
                                isExpired ? "text-danger" : ""
                              }`}
                            >
                              {formatDuration(remainingMs)}
                            </div>
                          ) : (
                            <div className="text-muted">-</div>
                          )}
                        </div>
                      )}
                      {invoice.description && (
                        <div className="mb-1">
                          <div className="text-muted small">
                            {t("invoices.description")}
                          </div>
                          <div className="text-muted">
                            {invoice.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="card mt-4">
                <div className="card-header">
                  <h6 className="mb-0">
                    {t("payment.progress") || "Payment Progress"}
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column w-100">
                    {/* Step 1 */}
                    <div className="d-flex">
                      <div className="d-flex flex-column align-items-center me-3">
                        <span
                          className={`d-inline-flex align-items-center justify-content-center rounded-circle border ${
                            isExpiredUnpaid
                              ? 'border-secondary opacity-75'
                              : isPaid
                                ? 'border-secondary opacity-75'
                                : currentStep >= 1
                                  ? 'border-primary'
                                  : 'border-secondary'
                          } bg-white`}
                          style={{ width: 36, height: 36 }}
                        >
                          <i
                            className={`bx bx-coin-stack ${
                              isExpiredUnpaid
                                ? 'text-secondary'
                                : isPaid
                                  ? 'text-secondary'
                                  : currentStep >= 1
                                    ? 'text-primary'
                                    : 'text-secondary'
                            }`}
                          ></i>
                        </span>
                        <div
                          className={`vr my-2 align-self-center ${
                            isExpiredUnpaid
                              ? 'opacity-50'
                              : isPaid
                                ? 'opacity-25'
                                : currentStep >= 2
                                  ? 'opacity-50'
                                  : 'opacity-25'
                          }`}
                          style={{ height: 14 }}
                        ></div>
                      </div>
                      <div className="pt-1">
                        <div
                          className={`fw-semibold ${
                            isExpiredUnpaid
                              ? 'text-muted'
                              : isPaid
                                ? 'text-muted'
                                : currentStep === 1
                                  ? 'text-body'
                                  : 'text-muted'
                          }`}
                        >
                          {t("payment.waiting") || "Waiting for payment"}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 (Expired lives here) */}
                    <div className="d-flex">
                      <div className="d-flex flex-column align-items-center me-3">
                        <span
                          className={`d-inline-flex align-items-center justify-content-center rounded-circle border ${
                            isExpiredUnpaid
                              ? 'border-danger'
                              : isPaid
                                ? 'border-secondary opacity-75'
                                : currentStep >= 2
                                  ? 'border-primary'
                                  : 'border-secondary'
                          } bg-white`}
                          style={{ width: 36, height: 36 }}
                        >
                          <i
                            className={`bx ${
                              isExpiredUnpaid
                                ? 'bx-calendar-x text-danger'
                                : isPaid
                                  ? 'bx-time-five text-secondary'
                                  : currentStep >= 2
                                    ? 'bx-time-five text-primary'
                                    : 'bx-time-five text-secondary'
                            }`}
                          ></i>
                        </span>
                        {!isExpiredUnpaid && (
                          <div
                            className={`vr my-2 align-self-center ${
                              isPaid ? 'opacity-25' : currentStep >= 3 ? 'opacity-50' : 'opacity-25'
                            }`}
                            style={{ height: 14 }}
                          ></div>
                        )}
                      </div>
                      <div className="pt-1">
                        <div
                          className={`fw-semibold ${
                            isExpiredUnpaid
                              ? 'text-danger'
                              : isPaid
                                ? 'text-muted'
                                : currentStep === 2
                                  ? 'text-body'
                                  : 'text-muted'
                          }`}
                        >
                          {isExpiredUnpaid
                            ? t('payment.expired') || 'Expired'
                            : t("payment.processing") || "Processing payment"}
                        </div>
                      </div>
                    </div>

                    {/* Step 3 (Completed; hidden when expired) */}
                    {!isExpiredUnpaid && (
                      <div className="d-flex">
                        <div className="d-flex flex-column align-items-center me-3">
                          <span
                            className={`d-inline-flex align-items-center justify-content-center rounded-circle border ${
                              isPaid
                                ? 'border-success'
                                : currentStep >= 3
                                  ? 'border-primary'
                                  : 'border-secondary'
                            } bg-white`}
                            style={{ width: 36, height: 36 }}
                          >
                            <i
                              className={`bx ${
                                isPaid
                                  ? 'bx-badge-check text-success'
                                  : currentStep >= 3
                                    ? 'bx-like text-primary'
                                    : 'bx-like text-secondary'
                              }`}
                            ></i>
                          </span>
                        </div>
                        <div className="pt-1">
                          <div
                            className={`fw-semibold ${
                              isPaid
                                ? 'text-success'
                                : currentStep === 3
                                  ? 'text-body'
                                  : 'text-muted'
                            }`}
                          >
                            {t('payment.completed') || 'Success!'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Progress bar and status removed per request */}
                  <div className="mt-3 small text-muted">
                    <div>
                      {t("invoices.createdAt")}:{" "}
                      {formatDateTime(invoice.createdAt || invoice.created_at)}
                    </div>
                    {invoice.expiryAt && (
                      <div>
                        {t("invoices.expiryAt")}:{" "}
                        {formatDateTime(invoice.expiryAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
