import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { listCoins } from "../../api/coins";
import { getBalancesWithFiat } from "../../api/balance";
import { MOCK_COINS, MOCK_BALANCE_DATA } from "./mockBalanceData";

// Coin asset helpers (reuse logic similar to wallet list)
function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const aliases = {
    btc: ["bitcoin"],
    eth: ["ethereum"],
    doge: ["dogecoin"],
    sol: ["solana"],
    matic: ["polygon"],
    pol: ["polygon"],
    ada: ["cardano"],
    xmr: ["monero"],
    zec: ["zcash"],
    usdt: ["usdterc20", "tether"],
    usdc: ["usd-coin"],
    bnb: ["binance"],
    bsc: ["binance"],
    trx: ["tron"],
    arb: ["arbitrum"],
    op: ["optimism"],
    base: ["base"],
    ln: ["lightning"],
  };
  const names = [sym, ...(aliases[sym] || [])];
  if (sym.startsWith("usdt") && !names.includes("usdt")) names.push("usdt");
  const exts = ["svg", "png"];
  const byAssets = names.flatMap((n) =>
    exts.map((ext) => `/assets/img/coins/${n}.${ext}`)
  );
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    "/assets/img/coins/default.svg",
  ];
  return Array.from(new Set(candidates));
}

function CoinImg({ coin, symbol, networkSymbol, size = 32 }) {
  const [idx, setIdx] = useState(0);
  const [netIdx, setNetIdx] = useState(0);
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl),
    [coin?.logoUrl, symbol]
  );
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null),
    [networkSymbol]
  );
  const src = candidates[Math.min(idx, candidates.length - 1)];
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)];
  // Use fixed size for badge instead of percentage for consistency
  const badgeSize = 18;
  
  return (
    <div className="position-relative me-3" style={{ width: size, height: size }}>
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
  );
}

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
  if (coin?.name) return coin.name;
  if (n?.network && typeof n.network === "object" && n.network.name)
    return n.network.name;
  if (typeof n?.network === "string") return n.network;
  const id = Number(n?.networkId ?? n);
  if (!Number.isFinite(id)) return "-";
  if (NETWORK_LABELS[id]) return NETWORK_LABELS[id];
  const sym = String(coin?.symbol || coin || "").toUpperCase();
  if (sym === "BTC") return id === 2 ? "Lightning" : "Bitcoin";
  if (sym === "ETH" && n?.contractAddress) return "ERC-20";
  return `Network #${n?.networkId ?? id ?? "-"}`;
}

function fmtAmount(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0";
  const s = n.toLocaleString(undefined, { maximumFractionDigits: 8 });
  return s;
}

export default function Balance() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fiat, setFiat] = useState({ amount: "0.0", currency: "USD" });
  const [rates, setRates] = useState({})
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        
        // Use mock data if enabled
        if (useMockData) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
          if (!mounted) return;
          setCoins(MOCK_COINS);
          setBalances(MOCK_BALANCE_DATA.breakdown);
          setFiat({
            amount: MOCK_BALANCE_DATA.fiat.amount,
            currency: MOCK_BALANCE_DATA.fiat.currency,
          });
          setRates(MOCK_BALANCE_DATA.fiat.rates);
          setError("");
        } else {
          // Use real API
          const [coinList, balanceRes] = await Promise.all([
            listCoins(token),
            getBalancesWithFiat(token, "USD"),
          ]);
          if (!mounted) return;
          setCoins(Array.isArray(coinList) ? coinList : []);
          // filter only coins that have value > 0
          const list = Array.isArray(balanceRes?.breakdown)
            ? balanceRes.breakdown
            : [];
          const filtered = list.filter((b) => {
            const a = Number(b?.availableBalance || b?.balance || 0);
            return Number.isFinite(a) && a > 0;
          });
          setBalances(filtered);
          if (balanceRes?.fiat && typeof balanceRes.fiat.amount === "string") {
            setFiat({
              amount: balanceRes.fiat.amount,
              currency: balanceRes.fiat.currency || "USD",
            });
            setRates(balanceRes.fiat.rates || {})
          } else {
            setFiat({ amount: "0.0", currency: "USD" });
            setRates({})
          }
        }
      } catch (e) {
        setError(e?.message || "Failed to load balances");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, useMockData]);

  // Map by coinNetworkId
  const coinNetById = useMemo(() => {
    const m = new Map();
    for (const cn of coins) {
      const id = Number(cn?.id);
      if (!Number.isNaN(id)) m.set(id, cn);
    }
    return m;
  }, [coins]);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Top Balances section with actions only */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div>
              <h4 className="card-title mb-1 fs-3">
                {t("balance.accountsTitle", {
                  defaultValue: "Balance accounts",
                })}
              </h4>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="text-muted mb-2">
            {t("balance.accountsSubtitle", {
              defaultValue: "Your balance from all accounts.",
            })}
          </div>
          <div className="display-3 fw-bold text-dark">
            {fiat.amount} {fiat.currency}
          </div>
          <div className="d-flex gap-2 flex-wrap mt-3">
            {/* <button type="button" className="btn btn-outline-primary" onClick={() => navigate('/app/balance/withdrawals')}>
              <i className="bx bx-export me-1"></i>{t('balance.withdraw', { defaultValue: 'Withdraw' })}
            </button> */}
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate("/app/invoices/create")}
            >
              <i className="bx bx-receipt me-1"></i>
              {t("actions.createInvoice", { defaultValue: "Create Invoice" })}
            </button>
          </div>
        </div>
      </div>

      {/* Accounts list section */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">
            {t("balance.account", { defaultValue: "Accounts" })}
          </h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border"
                role="status"
                aria-hidden="true"
              ></div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center text-muted py-5">
              {t("balance.noBalances", { defaultValue: "No balances to show" })}
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {balances.map((b, idx) => {
                const cn = coinNetById.get(Number(b.coinNetworkId));
                const coin = cn?.coin;
                const coinSym = (
                  b.coinSymbol ||
                  coin?.symbol ||
                  ""
                ).toUpperCase();
                const networkSym = (
                  b.networkSymbol ||
                  cn?.network?.symbol ||
                  ""
                ).toUpperCase();
                // Use networkName from API if available, otherwise fallback to network symbol or label
                const networkName = b.networkName || 
                  b.networkSymbol || 
                  cn?.network?.name || 
                  getNetworkLabel(cn, coin);
                const amount = fmtAmount(b.availableBalance || b.balance || 0);
                const amtNum = Number(b.availableBalance || b.balance || 0) || 0;
                const rate = Number((rates && rates[coinSym]) || 0) || 0;
                const usdVal = amtNum * rate;
                return (
                  <div
                    key={`${b.coinNetworkId}-${idx}`}
                    className="d-flex align-items-center justify-content-between border rounded-3 py-3 px-4"
                  >
                    <div className="d-flex align-items-center ms-5">
                      <CoinImg coin={coin} symbol={coinSym} networkSymbol={networkSym} />
                      <div className="ms-2">
                        <div className="fw-medium">{coinSym}</div>
                        <div className="text-muted small">{networkName}</div>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center gap-5">
                      {Number.isFinite(usdVal) ? (
                        <div className="text-muted small me-2 me-md-3">
                          {usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </div>
                      ) : null}
                      <div className="text-end me-2 me-md-3">
                        <div className="fw-medium">
                          {amount} {coinSym}
                        </div>
                      </div>
                      <div className="dropdown ms-3">
                        <button
                          className="btn btn-icon btn-outline-secondary"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title={t("actions.more", { defaultValue: "More" })}
                        >
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              className="dropdown-item"
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/app/balance/withdraw/${encodeURIComponent(
                                    String(b.coinNetworkId)
                                  )}`
                                )
                              }
                            >
                              <i className="bx bx-export me-2"></i>
                              {t("balance.withdraw", {
                                defaultValue: "Withdraw",
                              })}
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
