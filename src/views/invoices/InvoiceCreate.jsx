import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { createInvoice } from "../../api/invoices";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { listCoins, getCoinNetworks, getCoinNetworksBySymbol } from "../../api/coins";
// Removed wallet pre-check requirement; invoices can be created without existing wallets

// Try multiple sources for coin logos under public/assets/img/coins
function getCoinAssetCandidates(symbol, logoUrl) {
  // Normalize: lowercase and strip non-alphanumeric (covers spaces, dashes, parentheses, etc.)
  const sym = String(symbol || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    btc: ["bitcoin"],
    eth: ["ethereum"],
    doge: ["dogecoin"],
    sol: ["solana"],
    matic: ["polygon"],
    ada: ["cardano"],
    xmr: ["monero"],
    zec: ["zcash"],
  usdt: ["usdterc20", "tether"],
    usdttrc20: ["usdt", "tether"],
    usdterc20: ["usdt", "tether"],
    usdtbsc: ["usdt", "tether"],
    usdtbep20: ["usdt", "tether"],
    usdte: ["usdt", "tether"],
    usdtton: ["usdtton", "usdt", "tether"], // keep first to prefer network-specific icon if present
  };
  const names = [sym, ...(aliases[sym] || [])];
  // Generic fallback: if symbol starts with a known base (e.g., usdt-*) ensure base icon is considered
  if (sym.startsWith("usdt") && !names.includes("usdt")) names.push("usdt");
  const exts = ["svg", "png"]; // prefer svg, fallback png
  const byAssets = names.flatMap((n) => exts.map((ext) => `/assets/img/coins/${n}.${ext}`));
  // Prefer local assets first; then try remote URL from API; finally default
  const candidates = [...byAssets, ...(logoUrl ? [logoUrl] : []), "/assets/img/coins/default.svg"];
  // De-duplicate while preserving order
  return Array.from(new Set(candidates));
}

function CoinImg({ coin, symbol, size = 36 }) {
  const [idx, setIdx] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl).filter(c => !c.includes('default.svg')),
    [coin?.logoUrl, symbol]
  );
  const src = candidates[Math.min(idx, candidates.length - 1)];
  
  const handleError = () => {
    if (idx + 1 < candidates.length) {
      setIdx(i => i + 1);
    } else {
      setShowFallback(true);
    }
  };
  
  const getAvatarColor = (text) => {
    const colors = ['#7367F0', '#00CFE8', '#28C76F', '#FF9F43', '#EA5455', '#9966FF', '#00D4BD'];
    const colorIndex = text.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };
  
  if (candidates.length === 0 || showFallback) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '8px',
          backgroundColor: getAvatarColor(symbol || 'C'),
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
          fontWeight: 'bold'
        }}
      >
        {(symbol || 'C').charAt(0).toUpperCase()}
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className="rounded"
      onError={handleError}
    />
  );
}

// Map known numeric network IDs to human readable labels
const NETWORK_LABELS = {
  1: "Bitcoin",
  2: "Lightning",
  10: "Ethereum",
  11: "ERC-20",
  20: "BSC (BEP-20)",
  21: "BEP-20",
  30: "TRON (TRC-20)",
  31: "TRC-20",
  40: "Polygon",
  50: "Solana",
  60: "TON",
  61: "TON (Jetton)",
  70: "Base",
  80: "Arbitrum",
  90: "Optimism",
  100: "Avalanche C-Chain",
};

function getNetworkLabel(n, coin) {
  if (n?.networkName) return n.networkName;
  if (n?.network && typeof n.network === "object" && n.network.name) return n.network.name;
  if (typeof n?.network === "string") return n.network;
  const id = Number(n?.networkId);
  if (NETWORK_LABELS[id]) return NETWORK_LABELS[id];

  const sym = String(coin?.symbol || "").toUpperCase();
  if (sym === "BTC") return id === 2 ? "Lightning" : "Bitcoin";
  if (sym === "ETH" && n?.contractAddress) return "ERC-20";

  // Fallback generic label
  return `Network #${n?.networkId ?? "-"}`;
}

export default function InvoiceCreate() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  // No longer require wallet before creating invoice
  const [hasWallet] = useState(true);
  const [walletError] = useState("");
  const [coinNetworkId, setCoinNetworkId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [memo, setMemo] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [coins, setCoins] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState("");
  const [networks, setNetworks] = useState([]);

  // Wallet presence is not required anymore, so skip any pre-check

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCoins(true);
        const data = await listCoins(token);
        if (mounted) setCoins(data || []);
      } catch (e) {
        // non-blocking
      } finally { setLoadingCoins(false); }
    })();
    return () => { mounted = false };
  }, [token]);

  const grouped = useMemo(() => {
    const bySymbol = {};
    for (const c of coins) {
      const sym = c.coin?.symbol || `COIN-${c.coinId}`;
      if (!bySymbol[sym]) bySymbol[sym] = { coin: c.coin, items: [] };
      bySymbol[sym].items.push(c);
    }
    return bySymbol;
  }, [coins]);

  useEffect(() => {
    // Set default selected coin and preselect single network if applicable
    const keys = Object.keys(grouped);
    if (keys.length && !selectedCoin) {
      const first = keys[0];
      setSelectedCoin(first);
      const firstGroup = grouped[first];
      if (firstGroup?.items?.length === 1) {
        setCoinNetworkId(String(firstGroup.items[0].id));
      }
    }
    // If current coinNetworkId is not in newly selected coin, clear it
    if (selectedCoin) {
      const g = grouped[selectedCoin];
      if (g && !g.items.some((i) => String(i.id) === String(coinNetworkId))) {
        setCoinNetworkId("");
      }
    }
  }, [grouped, selectedCoin]);

  useEffect(() => {
    // Fetch networks for selected coin using symbol-based API
  async function fetchNetworks() {
      try {
        if (!selectedCoin) {
          setNetworks([]);
          return;
        }
        const data = await getCoinNetworksBySymbol(selectedCoin, token);
        setNetworks(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length === 1) {
          setCoinNetworkId(String(data[0].id));
        } else if (!data.some((n) => String(n.id) === String(coinNetworkId))) {
          setCoinNetworkId("");
        }
      } catch (e) {
        setNetworks([]);
      }
    }
    fetchNetworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoin, hasWallet]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!selectedCoin) {
      setError(t("validation.selectCoin") || "Please select a coin");
      return;
    }
    if (!coinNetworkId) {
      setError(t("validation.selectNetwork") || "Please select a network");
      return;
    }
    if (!amount) {
      setError(t("validation.requiredFields") || "Please fill required fields");
      return;
    }
    try {
      setLoading(true);
      const invoice = await createInvoice(
        {
          coinNetworkId: Number(coinNetworkId),
          amount: amount,
          description: description || undefined,
          memo: memo || undefined,
          expiryHours: expiryHours ? Number(expiryHours) : undefined,
        },
        token
      );
      const id = invoice.id || invoice.invoice?.id || invoice.data?.invoice?.id
      navigate(`/app/invoices/${id}`);
    } catch (e) {
      setError(typeof e?.message === "string" ? e.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {error && <div className="alert alert-danger">{error}</div>}
        {walletError && <div className="alert alert-warning">{walletError}</div>}

        {hasWallet === null && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="text-muted">{t('wallet.loading', { defaultValue: 'Loading wallet...' })}</div>
            </div>
          </div>
        )}

  {/* Wallet not required anymore; removed gating card */}

  <>
            {/* Step 1: Select Coin */}
            <div className="card mb-4">
              <div className="card-header d-flex align-items-center">
                <span className="badge bg-primary rounded-pill me-2">1</span>
                <h6 className="mb-0">{t("form.selectCoin")}</h6>
              </div>
              <div className="card-body">
                {loadingCoins ? (
                  <div className="text-muted">{t("invoices.loading")}</div>
                ) : (
                  <div className="row g-3">
                    {Object.entries(grouped).map(([sym, group]) => {
                      const isActive = selectedCoin === sym;
                      const networksCount = group.items.length;
                      return (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={sym}>
                          <div
                            role="button"
                            className={`card h-100 border-2 rounded-3 overflow-hidden ${isActive ? "border-primary bg-label-primary shadow-sm" : "border-2"}`}
                            onClick={() => {
                              setSelectedCoin(sym);
                              if (!group.items.some((i) => String(i.id) === String(coinNetworkId))) {
                                setCoinNetworkId("");
                              }
                            }}
                          >
                            <div className="card-body d-flex align-items-center gap-3">
                              <CoinImg coin={group.coin} symbol={sym} />
                              <div>
                                <div className="fw-bold">{sym}</div>
                                <div className="text-muted small">{group.coin?.name || ""}</div>
                                <div className="text-muted small">{t("form.networksCount", { count: networksCount })}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {coins.length === 0 && (
                      <div className="col-12 text-muted">{t("common.noData") || "No coins"}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Select Network */}
            <div className="card mb-4">
              <div className="card-header d-flex align-items-center">
                <span className="badge bg-primary rounded-pill me-2">2</span>
                <h6 className="mb-0">{t("form.selectNetwork")}</h6>
              </div>
              <div className="card-body">
                {selectedCoin ? (
                  <div className="d-flex flex-wrap gap-2">
                    {networks.map((n) => {
                      const selected = String(coinNetworkId) === String(n.id);
                      const label = getNetworkLabel(n, { symbol: selectedCoin });
                      return (
                        <button
                          type="button"
                          key={n.id}
                          className={`btn ${selected ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setCoinNetworkId(String(n.id))}
                        >
                          {label}
                        </button>
                      );
                    })}
                    {networks.length === 0 && (
                      <div className="text-muted small">{t("common.noData")}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted">{t("form.selectCoin")}</div>
                )}
                {/* Removed selected coin helper line per request */}
              </div>
            </div>
          </>

  <form onSubmit={onSubmit} className="card">
          <div className="card-body">
            <input type="hidden" name="coinNetworkId" value={coinNetworkId} />
            <div className="row g-3">
              {/* Removed manual Coin Network ID input. Now selected via UI above. */}
              <div className="col-sm-6 col-md-4">
                <label className="form-label">{t("invoices.amount")}</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.00000001"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="col-sm-6 col-md-4">
                <label className="form-label">{t("form.expiryHours") || "Expiry (hours)"}</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  placeholder="24"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                />
              </div>
              <div className="col-sm-6 col-md-6">
                <label className="form-label">{t("invoices.description")}</label>
                <input
                  className="form-control"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="col-sm-6 col-md-6">
                <label className="form-label">{t("invoices.note")}</label>
                <input
                  className="form-control"
                  placeholder="Memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)} disabled={loading}>
              {t("actions.back") || "Back"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !selectedCoin || !coinNetworkId || !amount}>
              {loading ? t("common.saving") || "Saving..." : t("invoice.createTitle")}
            </button>
          </div>
  </form>
      </div>
    </div>
  );
}
