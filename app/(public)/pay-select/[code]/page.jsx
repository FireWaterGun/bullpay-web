'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getPublicInvoice } from '@/lib/api/invoices';
import { listCoins } from '@/lib/api/coins';

import CoinNetworkList from '@/components/payment/CoinNetworkList';
import { Input, Spinner } from '../../../../components/ui'

export default function PaySelect() {
  const { t } = useTranslation();
  const { code } = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState(null);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCoinId, setSelectedCoinId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const year = new Date().getFullYear();

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [invoiceRes, coinList] = await Promise.all([
        getPublicInvoice(code).catch(() => null),
        listCoins().catch(() => [])]
        );
        if (cancelled) return;
        if (invoiceRes?.invoice) {
          setInvoice(invoiceRes.invoice);
        }
        // Filter only active and visible coins
        const enabled = (coinList || []).filter((c) => c.isActive && c.isVisible && c.status === 'active');
        setCoins(enabled);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {cancelled = true;};
  }, [code]);

  const STABLECOINS = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FDUSD'];

  // Group coins by symbol
  const coinGroups = useMemo(() => {
    const map = new Map();
    coins.forEach((cn) => {
      const sym = cn.coin?.symbol || 'Unknown';
      if (!map.has(sym)) {
        map.set(sym, {
          symbol: sym,
          name: cn.coin?.name || sym,
          logoUrl: cn.coin?.logoUrl,
          type: cn.coin?.type || 'token',
          isStableCoin: STABLECOINS.includes(sym.toUpperCase()),
          networks: []
        });
      }
      map.get(sym).networks.push(cn);
    });
    // Sort: stablecoins first, then alphabetical
    return Array.from(map.values()).sort((a, b) => {
      if (a.isStableCoin && !b.isStableCoin) return -1;
      if (!a.isStableCoin && b.isStableCoin) return 1;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [coins]);

  // Filtered by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return coinGroups;
    const q = searchQuery.toLowerCase();
    return coinGroups.filter((g) =>
    g.symbol.toLowerCase().includes(q) ||
    g.name.toLowerCase().includes(q) ||
    g.networks.some((n) =>
    (n.network?.name || '').toLowerCase().includes(q) ||
    (n.network?.symbol || '').toLowerCase().includes(q)
    )
    );
  }, [coinGroups, searchQuery]);

  const handleSelect = (coinNetworkId) => {
    setSelectedCoinId(coinNetworkId);
  };

  const handleConfirm = () => {
    if (!selectedCoinId) return;
    // Navigate to payment page with the selected coin
    router.push(`/pay/${code}?cn=${selectedCoinId}`);
  };

  const invoiceAmount = invoice?.amount || invoice?.requestedAmount;
  const invoiceCurrency = invoice?.fiatCurrency || invoice?.currency || 'USD';
  const invoiceDesc = invoice?.description;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
      background: 'linear-gradient(135deg, var(--color-surface-0, #fff) 0%, var(--color-surface-100) 100%)'
    }}>
      {/* Animated Gradient Background */}
      <div className="absolute w-full h-full z-0">
        <div className="absolute" style={{
          width: '150%', height: '150%', top: '-25%', left: '-25%',
          background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--color-primary-600) 8%, transparent) 0%, transparent 50%), radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--color-primary-600) 6%, transparent) 0%, transparent 50%)',
          animation: 'gradientShift 15s ease infinite',
          filter: 'blur(60px)'
        }}></div>
        <div className="absolute rounded-full w-[200px] h-[200px]" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-600) 15%, transparent) 0%, transparent 70%)', top: '10%', right: '15%', filter: 'blur(40px)', animation: 'float 20s ease-in-out infinite' }}></div>
        <div className="absolute rounded-full" style={{
          width: 250, height: 250,
          background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-600) 10%, transparent) 0%, transparent 70%)',
          bottom: '15%', left: '10%',
          filter: 'blur(50px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-[1]">
        <div className="container py-3">
          <div className="flex justify-center items-center gap-3">
            <div className="relative">
              <div className="absolute w-full h-full rounded-full bg-primary-600 opacity-50" style={{ filter: 'blur(20px)', animation: 'pulse 3s ease-in-out infinite' }}></div>
              <div className="relative flex items-center justify-center w-12 h-12 rounded-[16px]" style={{ background: 'linear-gradient(135deg, var(--color-primary-600) 0%, color-mix(in srgb, var(--color-primary-600), #000 25%) 100%)', boxShadow: '0 8px 20px color-mix(in srgb, var(--color-primary-600) 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.3)' }}>
                <i className="bx bx-wallet text-white text-[24px]"></i>
              </div>
            </div>
            <div>
              <h2 className="font-bold mb-0 text-xl tracking-[-0.5px] text-surface-900">BULL PAY</h2>
              <p className="mb-0 text-surface-500 text-xs tracking-[0.5px]">Crypto Payment Gateway</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -30px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes gradientShift {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Main Content */}
      <div className="grow flex items-start py-3 relative z-[1]">
        <div className="container">
          {loading ?
          <div className="text-center py-5">
              <Spinner role="status" size="lg" className="text-primary-600" />

            
            </div> :
          error && !invoice ?
          <div className="bg-white rounded-xl shadow-lg mx-auto p-0 max-w-[500px]">
              <div className="text-center p-5">
                <div className="mb-4">
                  <i className="bx bx-error-circle text-[64px] text-red-500"></i>
                </div>
                <h4 className="mb-3">{t('common.error', { defaultValue: 'Error' })}</h4>
                <p className="text-surface-500">{error}</p>
              </div>
            </div> :

          <div className="flex justify-center">
              <div className="w-full md:max-w-[83%] lg:max-w-[58%] xl:max-w-[50%]">
                {/* Main Card */}
                <div className="relative">
                  <div className="absolute w-full h-full rounded-[12px] opacity-60" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary-600) 20%, transparent), color-mix(in srgb, var(--color-primary-600) 15%, transparent))', filter: 'blur(30px)' }}></div>

                  <div className="relative rounded-[12px] overflow-hidden bg-white/95" style={{ backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)', border: '1px solid color-mix(in srgb, var(--color-primary-600) 15%, transparent)' }}>
                    {/* Title Banner */}
                    <div className="relative overflow-hidden py-[16px] px-[24px]" style={{ background: 'linear-gradient(135deg, var(--color-primary-600), color-mix(in srgb, var(--color-primary-600), #000 25%))' }}>
                      <div className="absolute w-full h-full z-0 top-[0px] left-[0px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'shimmer 3s infinite' }}></div>
                      <div className="text-center relative z-[1]">
                        <div className="inline-flex items-center gap-2">
                          <i className="bx bx-coin-stack text-white text-[20px]"></i>
                          <span className="font-bold uppercase text-white tracking-[2px] text-[0.875rem]">
                            {t('payment.selectAsset', { defaultValue: 'Select Payment Asset' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3 md:p-4">
                      {/* Invoice Info */}
                      {(invoiceAmount || invoiceDesc) &&
                    <div className="mb-3 p-3 rounded-lg text-center" style={{
                      background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary-600) 5%, transparent), color-mix(in srgb, var(--color-primary-600) 8%, transparent))',
                      border: '1px solid color-mix(in srgb, var(--color-primary-600) 15%, transparent)'
                    }}>
                          {invoiceAmount &&
                      <div className="mb-1">
                              <span className="text-sm uppercase font-semibold text-surface-500 tracking-[1px] text-[0.7rem]">
                                {t('invoices.amount', { defaultValue: 'Amount' })}
                              </span>
                              <div className="text-[2rem] tracking-[-1px] leading-[1.2]" style={{ fontWeight: '900', background: 'linear-gradient(135deg, var(--color-primary-600) 0%, color-mix(in srgb, var(--color-primary-600), #000 25%) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {invoiceAmount} {invoiceCurrency}
                              </div>
                            </div>
                      }
                          {invoiceDesc &&
                      <div className="text-sm text-surface-500">{invoiceDesc}</div>
                      }
                        </div>
                    }

                      {/* Search */}
                      <div className="mb-3 relative">
                        <i className="bx bx-search absolute left-[12px] text-surface-500 text-[18px]" style={{ top: '50%', transform: 'translateY(-50%)' }}></i>
                        <Input
                        type="text"

                        placeholder={t('payment.searchCoin', { defaultValue: 'Search coin or network...' })}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ border: '1px solid color-mix(in srgb, var(--color-primary-600) 20%, transparent)', background: 'color-mix(in srgb, var(--color-primary-600) 3%, transparent)' }} className="pl-[38px] rounded-[10px] text-[0.875rem]" />
                      
                      </div>

                      {/* Coin List */}
                      <div className="max-h-[420px] overflow-y-auto my-[0] mx-[-4px] py-[0] px-[4px]">
                        <CoinNetworkList
                        filteredGroups={filteredGroups}
                        selectedCoinId={selectedCoinId}
                        onSelect={handleSelect} />
                      
                      </div>

                      {/* Confirm Button */}
                      <div className="mt-3">
                        <button
                        className="w-full py-3 font-bold cursor-pointer border-none rounded-[12px] text-[1rem] tracking-[0.5px]"
                        disabled={!selectedCoinId}
                        onClick={handleConfirm}
                        style={{ background: selectedCoinId ?
                          'linear-gradient(135deg, var(--color-primary-600) 0%, color-mix(in srgb, var(--color-primary-600), #000 25%) 100%)' :
                          'var(--color-surface-200)', color: selectedCoinId ? 'white' : 'var(--color-surface-500)', transition: 'all 0.3s ease', boxShadow: selectedCoinId ?
                          '0 8px 24px color-mix(in srgb, var(--color-primary-600) 40%, transparent)' :
                          'none' }}>
                        
                          <i className="bx bx-check-circle mr-2"></i>
                          {t('payment.confirmSelection', { defaultValue: 'Continue with Selected Asset' })}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 relative z-[1]">
        <div className="container text-center">
          <div className="mb-2 text-surface-500 text-xs tracking-[1px] font-semibold">{t('common.poweredBy', { defaultValue: 'Powered by' })}</div>
          <div className="mb-2 text-[1.1rem] font-bold text-primary-600 tracking-[1px]">BULL PAY</div>
          <div className="text-surface-500 text-xs">
            {t('common.copyright', { year }) || `© ${year} · All rights reserved`}
          </div>
        </div>
      </footer>
    </div>);

}