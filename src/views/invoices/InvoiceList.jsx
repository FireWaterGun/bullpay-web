import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listInvoices } from "../../api/invoices";
import { useAuth } from "../../context/AuthContext";
import { formatAmount, formatDateTime } from "../../utils/format";

export default function InvoiceList() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const { token, user } = useAuth();

  const [selected, setSelected] = useState(new Set());
  const selectAllRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  const totalPages = useMemo(
    () => (limit ? Math.ceil((total || 0) / limit) : 1),
    [total, limit]
  );
  const rangeStart = useMemo(
    () => (total === 0 ? 0 : (page - 1) * limit + 1),
    [total, page, limit]
  );
  const rangeEnd = useMemo(
    () => Math.min(page * limit, total),
    [total, page, limit]
  );
  const visibleIds = useMemo(() => items.map((it) => it.id), [items]);
  const allSelected = useMemo(
    () => visibleIds.length > 0 && visibleIds.every((id) => selected.has(id)),
    [visibleIds, selected]
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listInvoices(
        {
          page,
          limit,
          sortBy,
          sortOrder,
          status,
        },
        token
      );
      setItems(res.items);
      setTotal(res.total || 0);
    } catch (e) {
      setError(
        typeof e?.message === "string" ? e.message : "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, limit, sortBy, sortOrder]);

  // Note: Pusher subscription is handled globally in DashboardLayout
  // No need to subscribe here to avoid duplicate notifications

  useEffect(() => {
    if (selectAllRef.current) {
      const noneSelected = visibleIds.every((id) => !selected.has(id));
      selectAllRef.current.indeterminate =
        !allSelected && !noneSelected && selected.size > 0;
    }
  }, [visibleIds, selected, allSelected]);

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set([...selected, ...visibleIds]));
    }
  }
  function toggleOne(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function applyFilters(e) {
    e?.preventDefault();
    setPage(1);
    load();
  }
  function resetFilters() {
    setStatus("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
    load();
  }

  function shortAddr(addr) {
    if (!addr) return "-";
    const s = String(addr);
    if (s.length <= 14) return s;
    return `${s.slice(0, 6)}...${s.slice(-6)}`;
  }
  async function handleCopy(addr, id) {
    if (!addr || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {/* List */}
        <div className="card">
          <div className="card-body">
            <div id="invoiceFilters" className="collapse show mb-5">
              <form onSubmit={applyFilters}>
                {/* Filters: only status and sorting controls retained */}
                  <div className="row g-3">
                  <div className="col-sm-6 col-md-3">
                    <label className="form-label">{t("invoices.status")}</label>
                    <select
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">{t("invoices.allStatus")}</option>
                      <option value="pending">{t("invoices.pending")}</option>
                      <option value="paid">{t("invoices.paid")}</option>
                      <option value="expired">{t("invoices.expired")}</option>
                    </select>
                  </div>
                  <div className="col-sm-6 col-md-3">
                    <label className="form-label">{t("invoices.sortBy")}</label>
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="created_at">{t("invoices.dateCreated")}</option>
                      <option value="amount">{t("invoices.amount")}</option>
                      <option value="expiry_at">{t("invoices.expiryAt") || "Expiry date"}</option>
                      <option value="paid_at">{t("invoices.paidAt") || "Paid date"}</option>
                    </select>
                  </div>
                  <div className="col-sm-6 col-md-3">
                    <label className="form-label">{t("invoices.sortOrder")}</label>
                    <select
                      className="form-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="desc">{t("invoices.sortNewest")}</option>
                      <option value="asc">{t("invoices.sortOldest")}</option>
                    </select>
                  </div>
                </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary">
                      {t("actions.applyFilters")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetFilters}
                    >
                      {t("actions.reset")}
                    </button>
                  </div>
              </form>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div className="text-muted">{t("invoices.loading")}</div>
            ) : (
              <div className="card-datatable table-responsive">
                <table className="invoice-list-table table border-top">
                  <thead>
                    <tr>
                      <th className="cell-fit">
                        <div className="form-check m-0">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            aria-label={t("invoices.selectAll") || "Select All"}
                            ref={selectAllRef}
                            checked={allSelected}
                            onChange={toggleAll}
                          />
                        </div>
                      </th>
                      <th className="cell-fit">{t("invoices.number") || "#"}</th>
                      <th>{t("invoices.invoice") || "Invoice"}</th>
                      <th>{t("invoices.amount")}</th>
                      <th>{t("invoices.statusCol")}</th>
                      <th>{t("invoices.date")}</th>
                      <th>{t("invoices.note")}</th>
                      <th className="text-end">{t("invoices.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          {t("invoices.none")}
                        </td>
                      </tr>
                    )}
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="cell-fit">
                          <div className="form-check m-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              aria-label={`select invoice ${it.id}`}
                              checked={selected.has(it.id)}
                              onChange={() => toggleOne(it.id)}
                            />
                          </div>
                        </td>
                        <td className="text-nowrap cell-fit">
                          <NavLink to={`/app/invoices/${it.id}`} className="fw-medium">
                            #{it.invoiceNumber || it.id}
                          </NavLink>
                        </td>
                        <td className="text-nowrap" style={{ maxWidth: 360 }}>
                          <div className="text-muted small d-flex align-items-center gap-2">
                            <span>{t("invoices.paymentAddress") || "Address"}:</span>
                            <span className="font-monospace">{shortAddr(it.paymentAddress)}</span>
                            {it.paymentAddress && (
                              <button
                                type="button"
                                className="btn btn-icon btn-sm btn-outline-secondary"
                                title={t("actions.copyAddress") || t("actions.copy") || "Copy"}
                                onClick={() => handleCopy(it.paymentAddress, it.id)}
                              >
                                <i className={`bx ${copiedId === it.id ? "bx-check text-success" : "bx-copy"}`}></i>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="text-nowrap">
                          {formatAmount(it.amount)} {it.coinNetwork?.coin?.symbol || it.coinNetwork?.symbol || ""}
                          <div className="text-muted small">
                            {it.coinNetwork?.network?.name || it.coinNetwork?.network || it.coinNetwork?.name || ""}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill text-capitalize ${
                              it.status === "paid"
                                ? "bg-label-success"
                                : it.status === "pending"
                                ? "bg-label-warning"
                                : "bg-label-secondary"
                            }`}
                          >
                            {it.status || "-"}
                          </span>
                        </td>
                        <td className="text-nowrap">{formatDateTime(it.createdAt || it.created_at)}</td>
                        <td>
                          <div className="text-muted small text-truncate" style={{ maxWidth: 260 }}>
                            {it.memo || it.description || "N/A"}
                          </div>
                        </td>
                        <td className="text-end">
                          <NavLink
                            to={`/app/invoices/${it.id}`}
                            className="btn btn-icon text-secondary"
                            title={t("actions.view") || "View"}
                          >
                            <i className="icon-base bx bx-show icon-20px"></i>
                          </NavLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Simple pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                {t("invoices.showingEntries", { start: rangeStart, end: rangeEnd, total })}
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("actions.prev")}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("actions.next")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
