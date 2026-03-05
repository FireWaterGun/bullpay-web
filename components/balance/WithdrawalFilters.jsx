'use client'

import { useState } from 'react'
import { WITHDRAWAL_STATUSES, formatStatusLabel } from './withdrawalHelpers'

const EMPTY_COINS = []

export default function WithdrawalFilters({ filters, onFilterChange, coins = EMPTY_COINS, onReset, t }) {
  const [expanded, setExpanded] = useState(false)

  function update(key, value) {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="card mb-3">
      <div className="px-5 py-4 border-b border-surface-200 py-2 flex justify-between items-center">
        <span className="font-semibold text-sm">
          <i className="bx bx-filter-alt mr-1"></i>
          {t?.('withdrawals.filters', { defaultValue: 'Filters' }) || 'Filters'}
        </span>
        <div className="flex gap-2">
          {onReset && (
            <button className="btn btn-sm btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none" onClick={onReset}>
              {t?.('actions.reset', { defaultValue: 'Reset' }) || 'Reset'}
            </button>
          )}
          <button className="btn btn-sm btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none" onClick={() => setExpanded(!expanded)}>
            <i className={`bx ${expanded ?'bx-chevron-up' : 'bx-chevron-down'}`}></i>
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-5 py-2">
          <div className="grid grid-cols-12 gap-x-6 gap-2">
            <div className="md:col-span-3">
              <label className="form-label text-sm">{t?.('withdrawals.status', { defaultValue: 'Status' }) || 'Status'}</label>
              <select
                className="form-input form-input text-sm py-1"
                value={filters.status || ''}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="">{t?.('common.all', { defaultValue: 'All' }) || 'All'}</option>
                {WITHDRAWAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{formatStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="form-label text-sm">{t?.('withdrawals.search', { defaultValue: 'Search' }) || 'Search'}</label>
              <input
                type="text"
                className="form-input form-input text-sm py-1"
                placeholder={t?.('withdrawals.searchPlaceholder', { defaultValue: 'Search...' }) || 'Search...'}
                value={filters.q || ''}
                onChange={(e) => update('q', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
