import { useEffect, useState, useCallback, useMemo } from "react";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getInvoice } from "../../api/invoices";
import { useAuth } from "../../context/AuthContext";
import { formatAmount, formatDateTime } from "../../utils/format";
import { listCoins } from "../../api/coins";
import { listNetworks } from "../../api/networks";

function getCoinAssetCandidates(symbol, logoUrl) {
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
  const byAssets = names.flatMap(n => exts.map(ext => `/assets/img/coins/${n}.${ext}`))
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    '/assets/img/coins/default.svg',
  ]
  return Array.from(new Set(candidates))
}

function CoinImg({ coin, symbol, networkSymbol, size = 40 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl),
    [coin?.logoUrl, symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null),
    [networkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 20

  return (
    <div className="position-relative me-2" style={{ width: size, height: size }}>
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
        onError={() => setIdx(i => (i + 1 < candidates.length ? i + 1 : i))}
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
            onError={() => setNetIdx(i => (i + 1 < networkCandidates.length ? i + 1 : i))}
          />
        </div>
      )}
    </div>
  )
}

function CountdownTimer({ expiryAt }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!expiryAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { expired: false, days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryAt]);

  if (!timeLeft) return null;

  if (timeLeft.expired) {
    return (
      <div className="alert alert-danger mb-0">
        <div className="d-flex align-items-center mb-2">
          <i className="bx bx-time-five fs-5 me-2"></i>
          <div className="fw-medium">{t('payment.expired') || 'Expired'}</div>
        </div>
        <small>{t('payment.expiredMessage') || 'This invoice has expired'}</small>
      </div>
    );
  }

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="alert alert-warning mb-0">
      <div className="d-flex align-items-center mb-2">
        <i className="bx bx-time-five fs-5 me-2"></i>
        <div className="fw-medium">{t('payment.timeRemaining') || 'Time Remaining'}</div>
      </div>
      <div className="d-flex gap-3 justify-content-center">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="fs-3 fw-bold">{pad(timeLeft.days)}</div>
            <small className="text-muted">{t('time.days') || 'Days'}</small>
          </div>
        )}
        <div className="text-center">
          <div className="fs-3 fw-bold">{pad(timeLeft.hours)}</div>
          <small className="text-muted">{t('time.hours') || 'Hours'}</small>
        </div>
        <div className="text-center">
          <div className="fs-3 fw-bold">{pad(timeLeft.minutes)}</div>
          <small className="text-muted">{t('time.minutes') || 'Minutes'}</small>
        </div>
        <div className="text-center">
          <div className="fs-3 fw-bold">{pad(timeLeft.seconds)}</div>
          <small className="text-muted">{t('time.seconds') || 'Seconds'}</small>
        </div>
      </div>
    </div>
  );
}

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
  const [coins, setCoins] = useState([]);
  const [networks, setNetworks] = useState([]);

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
        const [invoiceRes, coinsData, networksData] = await Promise.all([
          getInvoice(id, token),
          listCoins(token),
          listNetworks(token)
        ]);
        if (mounted) {
          setInvoice(invoiceRes);
          setCoins(Array.isArray(coinsData) ? coinsData : []);
          setNetworks(Array.isArray(networksData) ? networksData : []);
        }
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

  const cnWithNetwork = useMemo(() => {
    if (!invoice?.coinNetwork) return null;
    const cn = invoice.coinNetwork;
    const network = networks.find(n => Number(n.id) === Number(cn.networkId));
    return { ...cn, network: network || cn.network };
  }, [invoice, networks]);

  const cn = cnWithNetwork || invoice?.coinNetwork;
  const coinSym = (cn?.coin?.symbol || cn?.symbol || "").toUpperCase();
  const networkSym = (cn?.network?.symbol || "").toUpperCase();
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
                      <label className="form-label">{t("invoices.coin") || "Coin"}</label>
                      <div className="d-flex align-items-center">
                        <CoinImg coin={cn?.coin} symbol={coinSym} networkSymbol={networkSym} size={32} />
                        <div>
                          <div className="fw-medium">{coinSym}</div>
                          <div className="text-muted small">{networkName}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t("invoices.paidAmount") || "Paid"}</label>
                      <div>
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
                            rel="noreferrer"
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
              {invoice.status === 'pending' && invoice.expiryAt && (
                <div className="card mb-4">
                  <div className="card-body">
                    <CountdownTimer expiryAt={invoice.expiryAt} />
                  </div>
                </div>
              )}
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
