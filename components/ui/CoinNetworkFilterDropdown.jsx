'use client';

import { useState, useRef, useEffect } from 'react';
import CoinImg from '@/components/CoinImg';
import { inputClass } from '@/components/ui';

/**
 * A React-state-managed coin/network filter dropdown.
 * Replaces the old Bootstrap-dependent dropdown pattern.
 *
 * @param {object} props
 * @param {Array} props.coinNetworks - List of coin/network objects with { id, coin?, network? }
 * @param {string} props.value - Currently selected coinNetworkId (or '' for All)
 * @param {(val: string) => void} props.onChange - Callback when a coin/network is selected
 * @param {string} [props.allLabel='All'] - Label for the "All" option
 */
export default function CoinNetworkFilterDropdown({ coinNetworks = [], value, onChange, allLabel = 'All' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = value
    ? coinNetworks.find((c) => String(c.id) === String(value))
    : null;

  return (
    <div className="relative" ref={ref}>
      <button
        className={`${inputClass()} w-full flex items-center justify-between text-left`}
        type="button"
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <CoinImg
              symbol={(selected.coin?.symbol || '').toUpperCase()}
              networkSymbol={(selected.network?.symbol || '').toUpperCase()}
              size={22}
            />
            <span className="font-semibold text-[0.85rem]">
              {(selected.coin?.symbol || '').toUpperCase()}
            </span>
            <span className="text-surface-500 text-xs">
              {(selected.network?.symbol || '').toUpperCase()}
            </span>
          </span>
        ) : (
          <span className="text-surface-500">{allLabel}</span>
        )}
        <i className={`bx bx-chevron-${open ? 'up' : 'down'} text-surface-400`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-200 bg-card shadow-lg max-h-[280px] overflow-y-auto">
          <button
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-white/6 text-sm text-surface-500"
            onClick={() => { onChange(''); setOpen(false); }}
          >
            {allLabel}
          </button>
          <hr className="border-surface-200" />
          {coinNetworks.map((cn) => {
            const sym = (cn.coin?.symbol || '').toUpperCase();
            const net = (cn.network?.symbol || '').toUpperCase();
            return (
              <button
                type="button"
                key={cn.id}
                className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-white/6 flex items-center gap-2"
                onClick={() => { onChange(String(cn.id)); setOpen(false); }}
              >
                <CoinImg symbol={sym} networkSymbol={net} size={28} />
                <div>
                  <div className="font-semibold text-[0.85rem]">{sym}</div>
                  <div className="text-surface-500 text-[0.7rem]">{net}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
