import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getInvoice } from "../../api/invoices";
import { useAuth } from "../../context/AuthContext";
import { formatAmount, formatDateTime } from "../../utils/format";
import { useInvoiceEvents } from "../../hooks/useInvoiceEvents";
import CoinImg from '../../components/CoinImg'
import { statusClass } from "./invoiceDetailHelpers";
import InvoicePaymentsTable from "./InvoicePaymentsTable";
import InvoiceDetailActions from "./InvoiceDetailActions";

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Subscribe to invoice events
  useInvoiceEvents(id, {
    onPaymentReceived: () => loadInvoice(),
    onStatusChanged: () => loadInvoice(),
    onUpdated: () => loadInvoice(),
    onPaymentCompleted: () => loadInvoice(),
  });

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // Note: Pusher subscription is handled globally in DashboardLayout
  // No need to subscribe here to avoid duplicate notifications

  // Extract coin and network info from invoice response
  const coinSym = (invoice?.coin?.symbol || "").toUpperCase();
  const networkSym = (invoice?.network?.symbol || "").toUpperCase();
  const networkName = invoice?.network?.name || "";
  const explorer = invoice?.network?.explorerUrl || "";
  const cn = invoice ? {
    coin: invoice.coin,
    network: invoice.network,
    decimals: invoice.decimals
  } : null;

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
                  <div>
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      <span>{invoice.publicCode || invoice.code || invoice.id}</span>
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

                  <hr className="my-4" />

                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">{t("invoices.chain") || "Chain"}</label>
                      <div className="fw-medium text-muted">{networkSym || 'N/A'}</div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">{t("invoices.coin") || "Coin"}</label>
                      <div className="d-flex align-items-center">
                        <CoinImg coin={cn?.coin} symbol={coinSym} networkSymbol={networkSym} size={32} className="me-2" />
                        <div>
                          <div className="fw-medium">{coinSym}</div>
                          <div className="text-muted small">{networkName}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">{t("invoices.amount") || "Amount"}</label>
                      <div className="fw-medium">
                        {formatAmount(invoice.amount)} {coinSym}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">{t("invoices.paidAmount") || "Paid Amount"}</label>
                      <div className="fw-medium">
                        {formatAmount(invoice.paidAmount || 0)} {coinSym}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mt-3">
                    <div className="col-12">
                      <label className="form-label">{t("invoices.paymentAddress") || "Payment Address"}</label>
                      <div className="d-flex align-items-center">
                        <code className="me-2 text-wrap flex-grow-1" style={{ wordBreak: "break-all" }}>
                          {invoice.paymentAddress || "-"}
                        </code>
                        {explorer && invoice.paymentAddress && (
                          <a
                            className="btn btn-sm btn-outline-secondary"
                            href={`${explorer.replace(/\/$/, "")}/address/${invoice.paymentAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bx bx-link-external"></i>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="form-label">{t("invoices.description") || "Description"}</label>
                    <div className="text-muted">{invoice.description || invoice.memo || "-"}</div>
                  </div>

                  <div className="mt-4">
                    <h6 className="mb-2">{t("invoices.payments") || "Payments"}</h6>
                    <InvoicePaymentsTable
                      payments={invoice.payments}
                      coinSym={coinSym}
                      explorer={explorer}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <InvoiceDetailActions invoice={invoice} explorer={explorer} />
          </div>
        )}
      </div>
    </div>
  );
}
