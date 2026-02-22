import { useTranslation } from "react-i18next";
import CoinImg, { NetworkIcon } from '../../components/CoinImg'

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

  return `Network #${n?.networkId ?? "-"}`;
}

export default function CoinNetworkSelector({
  grouped,
  coins,
  loadingCoins,
  selectedCoin,
  setSelectedCoin,
  coinNetworkId,
  setCoinNetworkId,
  networks,
}) {
  const { t } = useTranslation();

  return (
    <>
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
                        <CoinImg coin={group.coin} symbol={sym} size={36} showFallback imgClassName="rounded" />
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
                    className={`btn d-inline-flex align-items-center gap-2 ${selected ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setCoinNetworkId(String(n.id))}
                  >
                    <NetworkIcon networkSymbol={n.network?.symbol || ''} size={18} />
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
        </div>
      </div>
    </>
  );
}
