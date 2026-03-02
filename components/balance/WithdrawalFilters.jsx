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
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <span className="fw-semibold small">
          <i className="bx bx-filter-alt me-1"></i>
          {t?.('withdrawals.filters', { defaultValue: 'Filters' }) || 'Filters'}
        </span>
        <div className="d-flex gap-2">
          {onReset && (
            <button className="btn btn-sm btn-text-secondary" onClick={onReset}>
              {t?.('actions.reset', { defaultValue: 'Reset' }) || 'Reset'}
            </button>
          )}
          <button className="btn btn-sm btn-text-secondary" onClick={() => setExpanded(!expanded)}>
            <i className={`bx ${expanded ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
          </button>
        </div>
      </div>
      {expanded && (
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label small">{t?.('withdrawals.status', { defaultValue: 'Status' }) || 'Status'}</label>
              <select
                className="form-select form-select-sm"
                value={filters.status || ''}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="">{t?.('common.all', { defaultValue: 'All' }) || 'All'}</option>
                {WITHDRAWAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{formatStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">{t?.('withdrawals.search', { defaultValue: 'Search' }) || 'Search'}</label>
              <input
                type="text"
                className="form-control form-control-sm"
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
