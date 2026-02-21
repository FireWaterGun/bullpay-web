import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { listCoins } from "../../api/coins";
import { getBalancesWithFiat } from "../../api/balance";
import { MOCK_COINS, MOCK_BALANCE_DATA } from "./mockBalanceData";
import { formatCoinAmount } from '../../utils/format'
import CoinImg from '../../components/CoinImg'

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
            // Support new structure: availableBalance first, then totalBalance or confirmedBalance, fallback to balance
            const a = Number(b?.availableBalance || b?.totalBalance || b?.confirmedBalance || b?.balance || 0);
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
            {formatCoinAmount(fiat.amount)} {fiat.currency}
          </div>
          <div className="d-flex gap-2 flex-wrap mt-3">
            {/* <button type="button" className="btn btn-outline-primary" onClick={() => navigate('/wallet/withdrawals')}>
              <i className="bx bx-export me-1"></i>{t('balance.withdraw', { defaultValue: 'Withdraw' })}
            </button> */}
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate("/invoices/create")}
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
                // Support new structure: coin and network objects from API, fallback to old coinNetById lookup
                const cn = coinNetById.get(Number(b.coinNetworkId));
                const coin = b.coin || cn?.coin;
                const network = b.network || cn?.network;
                
                const coinSym = (
                  b.coin?.symbol ||
                  b.coinSymbol ||
                  coin?.symbol ||
                  ""
                ).toUpperCase();
                const networkSym = (
                  b.network?.symbol ||
                  b.networkSymbol ||
                  network?.symbol ||
                  ""
                ).toUpperCase();
                // Use networkName from API if available, otherwise fallback to network symbol or label
                const networkName = b.network?.name ||
                  b.networkName || 
                  b.networkSymbol || 
                  network?.name || 
                  getNetworkLabel(cn, coin);
                
                // Support new structure: availableBalance first, then totalBalance or confirmedBalance, fallback to balance
                const amount = formatCoinAmount(b.availableBalance || b.totalBalance || b.confirmedBalance || b.balance || 0);
                const amtNum = Number(b.availableBalance || b.totalBalance || b.confirmedBalance || b.balance || 0) || 0;
                
                // Use valueUsd from API if available, otherwise calculate from rate
                const rate = Number((rates && rates[coinSym]) || b.priceUsd || 0) || 0;
                const usdVal = Number(b.valueUsd) || (amtNum * rate);
                return (
                  <div
                    key={`${b.coinNetworkId}-${idx}`}
                    className="d-flex align-items-center justify-content-between border rounded-3 py-3 px-4"
                  >
                    <div className="d-flex align-items-center">
                      <div className="text-muted fw-medium me-3" style={{ minWidth: '80px' }}>
                        {networkSym || coinSym}
                      </div>
                      <CoinImg coin={coin} symbol={coinSym} networkSymbol={networkSym} className="me-3" />
                      <div className="ms-2">
                        <div className="fw-medium">{coinSym}</div>
                        <div className="text-muted small">{networkName}</div>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center gap-5">
                      {Number.isFinite(usdVal) ? (
                        <div className="text-muted small me-2 me-md-3">
                          {formatCoinAmount(usdVal, 2)} USD
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
                                  `/wallet/withdraw/${encodeURIComponent(
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
