import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { createInvoice } from "../../api/invoices";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { listCoins } from "../../api/coins";
import { useToastContext } from "../../context/ToastContext";
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
  const toast = useToastContext();
  // No longer require wallet before creating invoice
  const [hasWallet] = useState(true);
  const [walletError] = useState("");
  const [coinNetworkId, setCoinNetworkId] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [expiryHoursError, setExpiryHoursError] = useState("");
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
  }, [grouped, selectedCoin]);

  // Get selected network details
  const selectedNetwork = useMemo(() => {
    return networks.find(n => String(n.id) === String(coinNetworkId));
  }, [networks, coinNetworkId]);

  // Get min/max deposit limits from selected network
  const minDeposit = useMemo(() => {
    const min = selectedNetwork?.minDeposit ? parseFloat(selectedNetwork.minDeposit) : 0;
    return min;
  }, [selectedNetwork]);

  const maxDeposit = 1000000; // Max 1,000,000

  useEffect(() => {
    // Use networks from grouped data (already loaded from listCoins API)
    if (!selectedCoin) {
      setNetworks([]);
      setCoinNetworkId("");
      return;
    }
    
    const group = grouped[selectedCoin];
    if (group && group.items) {
      setNetworks(group.items);
      
      // Auto-select if only one network
      if (group.items.length === 1) {
        setCoinNetworkId(String(group.items[0].id));
      } else if (!group.items.some((i) => String(i.id) === String(coinNetworkId))) {
        // Clear if current selection is not in available networks
        setCoinNetworkId("");
      }
    } else {
      setNetworks([]);
      setCoinNetworkId("");
    }
  }, [selectedCoin, grouped, coinNetworkId]);

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
    // Check if there's already a validation error from real-time validation
    if (amountError) {
      setError(amountError);
      return;
    }
    if (expiryHoursError) {
      setError(expiryHoursError);
      return;
    }
    // Validate expiry hours
    if (expiryHours) {
      const hoursNum = parseInt(expiryHours);
      if (isNaN(hoursNum) || hoursNum < 1) {
        setError(t("validation.expiryHoursTooSmall") || "ชั่วโมงต้องไม่น้อยกว่า 1");
        return;
      }
      if (hoursNum > 24) {
        setError(t("validation.expiryHoursTooLarge") || "ชั่วโมงต้องไม่เกิน 24");
        return;
      }
    }
    // Validate amount range (redundant check for safety)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(t("validation.invalidAmount") || "จำนวนเงินต้องมากกว่า 0");
      return;
    }
    if (minDeposit > 0 && amountNum < minDeposit) {
      setError(t("validation.amountTooSmall", { min: minDeposit }) || `จำนวนเงินต้องไม่น้อยกว่า ${minDeposit}`);
      return;
    }
    if (amountNum > maxDeposit) {
      setError(t("validation.amountTooLarge", { max: maxDeposit.toLocaleString() }) || `จำนวนเงินต้องไม่เกิน ${maxDeposit.toLocaleString()}`);
      return;
    }
    
    // Check selected network (using useMemo value)
    if (!selectedNetwork?.network?.symbol) {
      setError("Invalid network selection");
      return;
    }
    
    try {
      setLoading(true);
      const invoice = await createInvoice(
        {
          coinSymbol: selectedCoin,
          networkSymbol: selectedNetwork.network.symbol,
          amount: amount,
          description: description || undefined,
          memo: memo || undefined,
          expiryHours: expiryHours ? Number(expiryHours) : undefined,
        },
        token
      );
      const id = invoice.id || invoice.invoice?.id || invoice.data?.invoice?.id
      toast.success(t('invoice.createSuccess', { defaultValue: 'Invoice created successfully' }));
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
                <label className="form-label">{t("invoices.amount")} *</label>
                <input
                  className={`form-control ${amountError ? 'is-invalid' : ''}`}
                  type="number"
                  step="0.00000001"
                  min={minDeposit || 0}
                  max={maxDeposit}
                  placeholder={minDeposit > 0 ? String(minDeposit) : "0.001"}
                  value={amount}
                  onInput={(e) => {
                    // ป้องกันทศนิยมเกิน 8 ตำแหน่งและจำนวนเต็มเกิน 10 หลัก
                    let value = e.target.value;
                    
                    if (value.includes('.')) {
                      const parts = value.split('.');
                      
                      // จำกัดจำนวนเต็มไม่เกิน 10 หลัก (รองรับ 1,000,000)
                      if (parts[0] && parts[0].replace('-', '').length > 10) {
                        parts[0] = parts[0].substring(0, parts[0].startsWith('-') ? 11 : 10);
                      }
                      
                      // จำกัดทศนิยมไม่เกิน 8 ตำแหน่ง
                      if (parts[1] && parts[1].length > 8) {
                        parts[1] = parts[1].substring(0, 8);
                      }
                      
                      e.target.value = parts.join('.');
                    } else if (value && value.replace('-', '').length > 10) {
                      // จำกัดจำนวนเต็มเมื่อไม่มีจุดทศนิยม
                      e.target.value = value.substring(0, value.startsWith('-') ? 11 : 10);
                    }
                  }}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // จำกัดความยาวและจำนวนทศนิยม
                    if (value !== '') {
                      // ตรวจสอบและจำกัดทศนิยมไม่เกิน 8 ตำแหน่ง
                      const parts = value.split('.');
                      if (parts.length === 2 && parts[1].length > 8) {
                        // ตัดทศนิยมให้เหลือ 8 ตำแหน่ง
                        value = `${parts[0]}.${parts[1].substring(0, 8)}`;
                      }
                      
                      // ตรวจสอบค่าไม่เกิน max - ถ้าเกินให้หยุดการพิมพ์ (ไม่ update state)
                      const num = parseFloat(value);
                      if (!isNaN(num) && num > maxDeposit) {
                        // หยุดการพิมพ์ โดยไม่ update state
                        return;
                      }
                    }
                    
                    setAmount(value);
                    
                    // Real-time validation
                    if (value === '') {
                      setAmountError('');
                      return;
                    }
                    
                    const num = parseFloat(value);
                    if (isNaN(num)) {
                      setAmountError(t("validation.invalidAmount") || "จำนวนเงินไม่ถูกต้อง");
                    } else if (num <= 0) {
                      setAmountError(t("validation.amountMustBePositive") || "จำนวนเงินต้องมากกว่า 0");
                    } else if (minDeposit > 0 && num < minDeposit) {
                      setAmountError(t("validation.amountTooSmall", { min: minDeposit }) || `จำนวนเงินต้องไม่น้อยกว่า ${minDeposit}`);
                    } else if (num > maxDeposit) {
                      setAmountError(t("validation.amountTooLarge", { max: maxDeposit.toLocaleString() }) || `จำนวนเงินต้องไม่เกิน ${maxDeposit.toLocaleString()}`);
                    } else {
                      setAmountError('');
                    }
                  }}
                  onBlur={(e) => {
                    // ตรวจสอบอีกครั้งเมื่อ blur เพื่อให้แน่ใจว่าทศนิยมถูกต้อง
                    let value = e.target.value;
                    if (value !== '') {
                      // ตัดทศนิยมเกิน 8 ตำแหน่ง
                      const parts = value.split('.');
                      if (parts.length === 2 && parts[1].length > 8) {
                        value = `${parts[0]}.${parts[1].substring(0, 8)}`;
                        // อัพเดทค่าถ้ามีการเปลี่ยนแปลง
                        setAmount(value);
                      }
                    }
                  }}
                  required
                />
                {amountError && <div className="invalid-feedback d-block">{amountError}</div>}
                {!amountError && (
                  <small className="text-muted">
                    {minDeposit > 0 
                      ? t("invoices.amountRange", { min: minDeposit, max: maxDeposit.toLocaleString() })
                      : t("invoices.maxAmountInfo", { max: maxDeposit.toLocaleString() })
                    }
                  </small>
                )}
              </div>
              <div className="col-sm-6 col-md-4">
                <label className="form-label">{t("form.expiryHours") || "Expiry (hours)"}</label>
                <input
                  className={`form-control ${expiryHoursError ? 'is-invalid' : ''}`}
                  type="number"
                  min={1}
                  max={24}
                  placeholder="24"
                  value={expiryHours}
                  onInput={(e) => {
                    // จำกัดจำนวนหลักไม่เกิน 2 หลัก (รองรับ 24)
                    const value = e.target.value;
                    if (value && value.replace('-', '').length > 2) {
                      e.target.value = value.substring(0, 2);
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    
                    // ตรวจสอบค่าไม่เกิน 24 - ถ้าเกินให้หยุดการพิมพ์
                    if (value !== '') {
                      const num = parseInt(value);
                      if (!isNaN(num) && num > 24) {
                        // หยุดการพิมพ์
                        return;
                      }
                      if (!isNaN(num) && num < 1) {
                        setExpiryHoursError(t("validation.expiryHoursTooSmall") || "ชั่วโมงต้องไม่น้อยกว่า 1");
                      } else if (!isNaN(num) && num > 24) {
                        setExpiryHoursError(t("validation.expiryHoursTooLarge") || "ชั่วโมงต้องไม่เกิน 24");
                      } else {
                        setExpiryHoursError('');
                      }
                    } else {
                      setExpiryHoursError('');
                    }
                    
                    setExpiryHours(value);
                  }}
                />
                {expiryHoursError && <div className="invalid-feedback d-block">{expiryHoursError}</div>}
                {!expiryHoursError && (
                  <small className="text-muted">
                    {t("invoices.expiryHoursRange")}
                  </small>
                )}
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
            <button type="submit" className="btn btn-primary" disabled={loading || !selectedCoin || !coinNetworkId || !amount || !!amountError}>
              {loading ? t("common.saving") || "Saving..." : t("invoice.createTitle")}
            </button>
          </div>
  </form>
      </div>
    </div>
  );
}
