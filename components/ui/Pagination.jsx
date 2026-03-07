'use client'

import { useTranslation } from 'react-i18next'

/* Pagination — replaces the 257 inline pagination blocks.
   Expects: { page, totalPages, total, limit, hasPrev, hasNext } */
export default function Pagination({ pagination, onPageChange, loading = false, showInfo = true, className = '' }) {
  const { t } = useTranslation()

  if (!pagination || pagination.total <= 0) return null

  const { page, totalPages, total, limit, hasPrev, hasNext } = pagination
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  /* ── Shared button classes ── */
  const btn = [
    'inline-flex items-center justify-center gap-1 text-sm font-medium transition-colors',
    'border border-surface-200 leading-[1.375]',
    'px-3 py-[0.4rem]',
    'text-surface-600 bg-card',
    'hover:enabled:bg-surface-50 hover:enabled:text-surface-800',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ')

  const btnFirst = `${btn} rounded-l-btn -mr-px`
  const btnMid = `${btn} -mr-px`
  const btnLast = `${btn} rounded-r-btn`

  return (
    <div className={`flex flex-wrap justify-between items-center gap-3 ${className}`}>
      {showInfo && (
        <div className="text-sm text-surface-500">
          {t('invoices.showingEntries', {
            start,
            end,
            total,
            defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries',
          })}
        </div>
      )}

      <div className="inline-flex">
        <button
          type="button"
          className={btnFirst}
          disabled={!hasPrev || loading}
          onClick={() => onPageChange(page - 1)}
        >
          <i className="bx bx-chevron-left text-base" />
          {t('actions.prev', { defaultValue: 'Previous' })}
        </button>

        <button type="button" className={btnMid} disabled>
          {page} / {totalPages}
        </button>

        <button type="button" className={btnLast} disabled={!hasNext || loading} onClick={() => onPageChange(page + 1)}>
          {t('actions.next', { defaultValue: 'Next' })}
          <i className="bx bx-chevron-right text-base" />
        </button>
      </div>
    </div>
  )
}
