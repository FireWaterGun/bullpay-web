'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { inputClass } from '@/components/ui/Input'

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
export default function CoinNetworkFilterDropdown({ coinNetworks = [], value, onChange, allLabel, className: extraClass }) {
  const { t } = useTranslation()
  const effectiveAllLabel = allLabel || t('common.all', { defaultValue: 'All' })
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search & focus when dropdown opens
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Small delay so the DOM renders before focusing
      requestAnimationFrame(() => searchRef.current?.focus())
    }
    prevOpenRef.current = open
  }, [open])

  // Clear search text when dropdown closes (computed during render, no setState in effect)
  const effectiveSearch = open ? search : ''

  const selected = value ? coinNetworks.find((c) => String(c.id) === String(value)) : null

  const filtered = effectiveSearch.trim()
    ? coinNetworks.filter((cn) => {
        const sym = (cn.coin?.symbol || '').toLowerCase()
        const net = (cn.network?.symbol || '').toLowerCase()
        const name = (cn.coin?.name || '').toLowerCase()
        const q = effectiveSearch.trim().toLowerCase()
        return sym.includes(q) || net.includes(q) || name.includes(q)
      })
    : coinNetworks

  return (
    <div className="relative" ref={ref}>
      <button
        className={`${inputClass()} select-base w-full flex items-center text-left${extraClass ? ` ${extraClass}` : ''}`}
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
            <span className="font-semibold text-[0.85rem]">{(selected.coin?.symbol || '').toUpperCase()}</span>
            <span className="text-surface-500 text-xs">{(selected.network?.symbol || '').toUpperCase()}</span>
          </span>
        ) : (
          <span className="text-surface-500">{effectiveAllLabel}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-200 bg-card shadow-lg flex flex-col max-h-[320px]">
          {/* Search input */}
          <div className="p-2 border-b border-surface-200">
            <div className="relative">
              <i className="bx bx-search absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm" />
              <input
                ref={searchRef}
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-surface-200 bg-surface-50 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-primary-400 placeholder:text-surface-400"
                placeholder={t('common.searchCoinOrNetwork', { defaultValue: 'Search coin or network...' })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {!effectiveSearch.trim() && (
              <>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-white/6 text-sm text-surface-500"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                >
                  {effectiveAllLabel}
                </button>
                <hr className="border-surface-200" />
              </>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-surface-400">{t('common.noResults', { defaultValue: 'No results' })}</div>
            ) : (
              filtered.map((cn) => {
                const sym = (cn.coin?.symbol || '').toUpperCase()
                const net = (cn.network?.symbol || '').toUpperCase()
                const isSelected = String(cn.id) === String(value)
                return (
                  <button
                    type="button"
                    key={cn.id}
                    className={`w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-white/6 flex items-center gap-2 ${isSelected ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}
                    onClick={() => {
                      onChange(String(cn.id))
                      setOpen(false)
                    }}
                  >
                    <CoinImg symbol={sym} networkSymbol={net} size={28} />
                    <div className="min-w-0">
                      <div className="font-semibold text-[0.85rem]">{sym}</div>
                      <div className="text-surface-500 text-[0.7rem]">{net}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
