'use client'

import { useState, useMemo } from 'react'
import CoinImg, { NetworkIcon } from '@/components/CoinImg'

const EMPTY_COINS = []

export default function CoinNetworkList({ coins = EMPTY_COINS, onSelect, selectedId, t }) {
  const [search, setSearch] = useState('')

  const grouped = useMemo(() => {
    const map = {}
    for (const cn of coins) {
      const sym = cn.coin?.symbol || cn.symbol || 'UNKNOWN'
      if (!map[sym]) {
        map[sym] = { symbol: sym, name: cn.coin?.name || sym, networks: [] }
      }
      map[sym].networks.push(cn)
    }
    return Object.values(map)
  }, [coins])

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped
    const q = search.toLowerCase()
    return grouped.filter(
      (g) =>
        g.symbol.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        g.networks.some((n) => (n.network?.name || '').toLowerCase().includes(q))
    )
  }, [grouped, search])

  return (
    <div>
      <div className="p-2">
        <input
          type="text"
          className="form-input form-input text-sm py-1"
          placeholder={t?.('invoices.searchCoin', { defaultValue: 'Search coin...' }) || 'Search coin...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="list-group list-group-flush" style={{ maxHeight: 260, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div className="text-center text-muted py-3 text-sm">
            {t?.('invoices.noCoinFound', { defaultValue: 'No coins found' }) || 'No coins found'}
          </div>
        )}
        {filtered.map((group) =>
          group.networks.map((cn) => (
            <button
              key={cn.id}
              type="button"
              className={`list-group-item list-group-item-action flex items-center gap-2 ${cn.id === selectedId ?'active' : ''}`}
              onClick={() => onSelect(cn)}
            >
              <CoinImg symbol={group.symbol} networkSymbol={cn.network?.symbol} size={24} />
              <div>
                <span className="font-medium">{group.symbol}</span>
                <small className="text-muted ml-1">
                  {cn.network?.name || cn.network?.symbol || ''}
                </small>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
