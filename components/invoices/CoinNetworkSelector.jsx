'use client';

import { useTranslation } from 'react-i18next';
import CoinImg, { NetworkIcon } from '@/components/CoinImg';
import { Card } from '@/components/ui'

const NETWORK_LABELS = {
  1: 'Bitcoin',
  2: 'Lightning',
  10: 'Ethereum',
  11: 'ERC-20',
  20: 'BSC (BEP-20)',
  21: 'BEP-20',
  30: 'TRON (TRC-20)',
  31: 'TRC-20',
  40: 'Polygon',
  50: 'Solana',
  60: 'TON',
  61: 'TON (Jetton)',
  70: 'Base',
  80: 'Arbitrum',
  90: 'Optimism',
  100: 'Avalanche C-Chain'
};

function getNetworkLabel(n, coin) {
  if (n?.networkName) return n.networkName;
  if (n?.network && typeof n.network === 'object' && n.network.name) return n.network.name;
  if (typeof n?.network === 'string') return n.network;
  const id = Number(n?.networkId);
  if (NETWORK_LABELS[id]) return NETWORK_LABELS[id];

  const sym = String(coin?.symbol || '').toUpperCase();
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin';
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20';

  return `Network #${n?.networkId ?? '-'}`;
}

export default function CoinNetworkSelector({
  grouped,
  coins,
  loadingCoins,
  selectedCoin,
  setSelectedCoin,
  coinNetworkId,
  setCoinNetworkId,
  networks
}) {
  const { t } = useTranslation();

  return (
    <>
      <Card className="mb-4">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-medium mr-2">1</span>
          <h6 className="mb-0 font-semibold">{t('form.selectCoin')}</h6>
        </div>
        <div className="p-6">
          {loadingCoins ?
          <div className="text-surface-500">{t('invoices.loading')}</div> :

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(grouped).map(([sym, group]) => {
              const isActive = selectedCoin === sym;
              const networksCount = group.items.length;
              return (
                <div key={sym}>
                    <div
                    role="button"
                    className={`rounded-lg border-2 overflow-hidden h-full cursor-pointer transition-colors ${isActive ? 'border-primary-600 bg-primary-50 shadow-sm dark:bg-primary-600/10' : 'border-surface-200 hover:border-surface-300'}`}
                    onClick={() => {
                      setSelectedCoin(sym);
                      if (!group.items.some((i) => String(i.id) === String(coinNetworkId))) {
                        setCoinNetworkId('');
                      }
                    }}>
                    
                      <div className="p-4 flex items-center gap-3">
                        <CoinImg coin={group.coin} symbol={sym} size={36} showFallback imgClassName="rounded" />
                        <div>
                          <div className="font-bold">{sym}</div>
                          <div className="text-surface-500 text-sm">{group.coin?.name || ''}</div>
                          <div className="text-surface-500 text-sm">{t('form.networksCount', { count: networksCount })}</div>
                        </div>
                      </div>
                    </div>
                  </div>);

            })}
              {coins.length === 0 &&
            <div className="col-span-full text-surface-500">{t('common.noData') || 'No coins'}</div>
            }
            </div>
          }
        </div>
      </Card>

      <Card className="mb-4">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-medium mr-2">2</span>
          <h6 className="mb-0 font-semibold">{t('form.selectNetwork')}</h6>
        </div>
        <div className="p-6">
          {selectedCoin ?
          <div className="flex flex-wrap gap-2">
              {networks.map((n) => {
              const selected = String(coinNetworkId) === String(n.id);
              const label = getNetworkLabel(n, { symbol: selectedCoin });
              return (
                <button
                  type="button"
                  key={n.id}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selected ? 'bg-primary-600 text-white border-primary-600' : 'bg-card text-surface-700 border-surface-200 hover:border-primary-400'}`}
                  onClick={() => setCoinNetworkId(String(n.id))}>
                  
                    <NetworkIcon networkSymbol={n.network?.symbol || ''} size={18} />
                    {label}
                  </button>);

            })}
              {networks.length === 0 &&
            <div className="text-surface-500 text-sm">{t('common.noData')}</div>
            }
            </div> :

          <div className="text-surface-500">{t('form.selectCoin')}</div>
          }
        </div>
      </Card>
    </>);

}