'use client';

import { useState, useMemo } from 'react';
import CoinImg, { NetworkIcon } from '@/components/CoinImg';
import { Input } from '@/components/ui'

const EMPTY_COINS = [];

export default function CoinNetworkList({ coins = EMPTY_COINS, onSelect, selectedId, t }) {
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const map = {};
    for (const cn of coins) {
      const sym = cn.coin?.symbol || cn.symbol || 'UNKNOWN';
      if (!map[sym]) {
        map[sym] = { symbol: sym, name: cn.coin?.name || sym, networks: [] };
      }
      map[sym].networks.push(cn);
    }
    return Object.values(map);
  }, [coins]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped.filter(
      (g) =>
      g.symbol.toLowerCase().includes(q) ||
      g.name.toLowerCase().includes(q) ||
      g.networks.some((n) => (n.network?.name || '').toLowerCase().includes(q))
    );
  }, [grouped, search]);

  return (
    <div>
      <div className="p-2">
        <Input
          type="text"

          placeholder={t?.('invoices.searchCoin', { defaultValue: 'Search coin...' }) || 'Search coin...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus className="text-sm py-1" />
        
      </div>
      <div className="max-h-[260px] overflow-y-auto">
        {filtered.length === 0 &&
        <div className="text-center text-surface-500 py-3 text-sm">
            {t?.('invoices.noCoinFound', { defaultValue: 'No coins found' }) || 'No coins found'}
          </div>
        }
        {filtered.map((group) =>
        group.networks.map((cn) =>
        <button
          key={cn.id}
          type="button"
          className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-surface-200 transition-colors ${cn.id === selectedId ? 'bg-primary-50 dark:bg-primary-600/10 text-primary-700 dark:text-primary-400' : 'hover:bg-surface-50 dark:hover:bg-white/6'}`}
          onClick={() => onSelect(cn)}>
          
              <CoinImg symbol={group.symbol} networkSymbol={cn.network?.symbol} size={24} />
              <div>
                <span className="font-medium">{group.symbol}</span>
                <small className="text-surface-500 ml-1">
                  {cn.network?.name || cn.network?.symbol || ''}
                </small>
              </div>
            </button>
        )
        )}
      </div>
    </div>);

}