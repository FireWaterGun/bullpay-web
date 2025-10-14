import { useEffect, useState, useCallback } from "react";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getInvoice } from "../../api/invoices";
import { useAuth } from "../../context/AuthContext";
import { formatAmount, formatDateTime } from "../../utils/format";

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedPublic, setCopiedPublic] = useState(false); // still used for fallback share copy
  const [shareError, setShareError] = useState("");

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInvoice(id, token);
      setInvoice(res);
    } catch (e) {
      setError(
        typeof e?.message === "string"
          ? e.message
          : "Failed to load invoice"
      );
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getInvoice(id, token);
        if (mounted) setInvoice(res);
      } catch (e) {
        if (mounted)
          setError(
            typeof e?.message === "string"
              ? e.message
              : "Failed to load invoice"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id, token]);

  // Note: Pusher subscription is handled globally in DashboardLayout
  // No need to subscribe here to avoid duplicate notifications

  const statusClass = (s) =>
    s === "paid"
      ? "bg-label-success"
      : s === "pending"
      ? "bg-label-warning"
      : "bg-label-secondary";

  // Removed print action per requirement

  const buildPublicUrl = useCallback(() => {
    if (!invoice?.publicCode) return '';
    if (typeof window === 'undefined') return `/pay/${invoice.publicCode}`;
    return `${window.location.origin}/pay/${invoice.publicCode}`;
  }, [invoice?.publicCode]);

  const handleOpenPublic = () => {
    const url = buildPublicUrl();
    if (!url) return;
    try { window.open(url, '_blank', 'noopener'); } catch {}
  };

  const handleSharePublic = async () => {
    setShareError("");
    const url = buildPublicUrl();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: invoice?.invoiceNumber || 'Invoice',
            text: t('invoices.shareText') || 'Invoice payment link',
            url,
        });
      } catch (e) {
        if (e && e.name !== 'AbortError') setShareError(t('actions.shareFailed') || 'Share failed');
      }
    } else {
      // Fallback copy
      try {
        await navigator.clipboard.writeText(url);
        setCopiedPublic(true);
        setTimeout(()=> setCopiedPublic(false), 1500);
      } catch {
        setShareError(t('actions.shareNotSupported') || 'Share not supported');
      }
    }
  };

  const cn = invoice?.coinNetwork;
  const coinSym = cn?.coin?.symbol || cn?.symbol || "";
  const networkName = cn?.network?.name || cn?.network || cn?.name || "";
  const explorer = cn?.network?.explorerUrl || cn?.explorerUrl || "";

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {error && <div className="alert alert-danger">{error}</div>}
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
        ) : !invoice ? (
          <div className="text-muted">{t("invoices.notFound") || "Not found"}</div>
        ) : (
          <div className="row invoice-preview">
            {/* Left: Invoice preview */}
            <div className="col-12 col-lg-9 mb-4">
              <div className="card invoice-preview-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <div>
                      <h5 className="mb-1 d-flex align-items-center gap-2">
                        <span>{invoice.invoiceNumber || invoice.id}</span>
                        <span className={`badge rounded-pill d-inline-flex align-items-center px-3 text-capitalize ${statusClass(invoice.status)}`}>
                          {invoice.status || "-"}
                        </span>
                      </h5>
                      <div className="text-muted small">
                        {t("invoices.createdAt") || "Created"}: {formatDateTime(invoice.createdAt || invoice.created_at)}
                      </div>
                      {invoice.expiryAt && (
                        <div className="text-muted small">
                          {t("invoices.expiryAt") || "Expires"}: {formatDateTime(invoice.expiryAt)}
                        </div>
                      )}
                    </div>
                    <div className="text-end">
                      <div className="fw-medium">
                        {formatAmount(invoice.amount)} {coinSym}
                      </div>
                      <div className="text-muted small">{networkName}</div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">{t("invoices.paymentAddress") || "Payment Address"}</label>
                      <div className="d-flex align-items-center">
                        <code className="me-2 text-wrap" style={{ wordBreak: "break-all" }}>
                          {invoice.paymentAddress || "-"}
                        </code>
                        {explorer && invoice.paymentAddress && (
                          <a
                            className="btn btn-sm btn-outline-secondary"
                            href={`${explorer.replace(/\/$/, "")}/address/${invoice.paymentAddress}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <i className="bx bx-link-external"></i>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t("invoices.paidAmount") || "Paid"}</label>
                      <div>
                        {formatAmount(invoice.paidAmount || 0)} {coinSym}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="form-label">{t("invoices.description") || "Description"}</label>
                    <div className="text-muted">{invoice.description || invoice.memo || "-"}</div>
                  </div>

                  {Array.isArray(invoice.payments) && invoice.payments.length > 0 && (
                    <div className="mt-4">
                      <h6 className="mb-2">{t("invoices.payments") || "Payments"}</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>{t("invoices.txHash") || "Tx Hash"}</th>
                              <th>{t("invoices.amount") || "Amount"}</th>
                              <th>{t("invoices.date") || "Date"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.payments.map((p, idx) => (
                              <tr key={p.id || idx}>
                                <td>{idx + 1}</td>
                                <td className="text-truncate" style={{ maxWidth: 240 }}>
                                  {p.txHash ? (
                                    explorer ? (
                                      <a href={`${explorer.replace(/\/$/, "")}/tx/${p.txHash}`} target="_blank" rel="noreferrer">
                                        {p.txHash}
                                      </a>
                                    ) : (
                                      p.txHash
                                    )
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td>
                                  {formatAmount(p.amount || 0)} {coinSym}
                                </td>
                                <td>{formatDateTime(p.createdAt || p.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="col-12 col-lg-3">
              <div className="card mb-4">
                <div className="card-body">
                  <h6 className="mb-3">{t("invoices.actions") || "Actions"}</h6>
                  <div className="d-grid gap-2">
                    {/* Print button removed */}
                    {invoice.publicCode && (
                      <>
                        <button type="button" className="btn btn-outline-primary" onClick={handleOpenPublic}>
                          <i className="bx bx-link-alt me-1"></i>
                          {t('actions.openPaymentLink') || 'Open payment page'}
                        </button>
                        <button type="button" className="btn btn-outline-info" onClick={handleSharePublic}>
                          <i className="bx bx-share-alt me-1"></i>
                          {t('actions.share') || 'Share'}
                        </button>
                      </>
                    )}
                    <a
                      className="btn btn-outline-secondary"
                      href={
                        explorer && invoice.paymentAddress
                          ? `${explorer.replace(/\/$/, "")}/address/${invoice.paymentAddress}`
                          : undefined
                      }
                      target={explorer ? "_blank" : undefined}
                      rel={explorer ? "noreferrer" : undefined}
                    >
                      <i className="bx bx-link-external me-1"></i>
                      {t("invoices.viewOnExplorer") || "View on Explorer"}
                    </a>
                    <NavLink to="/app/invoices" className="btn btn-outline-secondary">
                      <i className="bx bx-list-ul me-1"></i>
                      {t("nav.history") || "All invoices"}
                    </NavLink>
                  </div>
                  {shareError && <div className="alert alert-warning mt-3 py-2 mb-0 small">{shareError}</div>}
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  {invoice.publicCode && (
                    <>
                      <small className="text-muted d-block mb-1">{t('invoices.publicCode') || 'Public Code'}</small>
                      <div className="d-flex align-items-center mb-3 gap-2">
                        <code>{invoice.publicCode}</code>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleOpenPublic} title={t('actions.openPaymentLink') || 'Open payment page'}>
                          <i className="bx bx-link-alt"></i>
                        </button>
                      </div>
                    </>
                  )}
                  <small className="text-muted d-block mb-1">{t("invoices.invoiceId") || "Invoice ID"}</small>
                  <div className="fw-medium">{invoice.id}</div>
                  <small className="text-muted d-block mt-3 mb-1">{t("invoices.createdAt") || "Created"}</small>
                  <div>{formatDateTime(invoice.createdAt || invoice.created_at)}</div>
                  {invoice.expiryAt && (
                    <>
                      <small className="text-muted d-block mt-3 mb-1">{t("invoices.expiryAt") || "Expires"}</small>
                      <div>{formatDateTime(invoice.expiryAt)}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
