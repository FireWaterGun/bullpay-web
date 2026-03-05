'use client'

import { useTranslation } from 'react-i18next'

/* Pagination — replaces the 257 inline pagination blocks.
   Expects: { page, totalPages, total, limit, hasPrev, hasNext } */
export default function Pagination({
  pagination,
  onPageChange,
  loading = false,
  showInfo = true,
  className = '',
}) {
  const { t } = useTranslation()

  if (!pagination || pagination.total <= 0) return null

  const { page, totalPages, total, limit, hasPrev, hasNext } = pagination
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  /* ── Shared button classes ── */
  const btnBase = [
    'inline-flex items-center justify-center text-sm font-medium transition-all cursor-pointer',
    'rounded-btn border leading-[1.375]',
    'px-[0.8rem] py-[0.4rem]',
    // light
    'border-surface-300 text-surface-600 bg-transparent',
    'hover:enabled:bg-surface-100',
    // dark
    'dark:text-surface-900-text dark:border-dark-border',
    'dark:hover:enabled:bg-white/6 dark:hover:enabled:text-[#e2e4e9] dark:hover:enabled:border-dark-border-hover',
    // disabled
    'disabled:opacity-60 disabled:cursor-not-allowed',
  ].join(' ')

  return (
    <div className={`flex justify-between items-center mt-4 ${className}`}>
      {showInfo && (
        <div className="text-sm text-surface-500 dark:text-surface-900-text-secondary">
          {t('invoices.showingEntries', {
            start,
            end,
            total,
            defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries',
          })}
        </div>
      )}

      <div className="inline-flex rounded-lg shadow-sm">
        <button
          className={btnBase}
          disabled={!hasPrev || loading}
          onClick={() => onPageChange(page - 1)}
        >
          <i className="bx bx-chevron-left" /> {t('actions.prev', { defaultValue: 'Previous' })}
        </button>

        <button className={btnBase} disabled>
          {page} / {totalPages}
        </button>

        <button
          className={btnBase}
          disabled={!hasNext || loading}
          onClick={() => onPageChange(page + 1)}
        >
          {t('actions.next', { defaultValue: 'Next' })} <i className="bx bx-chevron-right" />
        </button>
      </div>
    </div>
  )
}
