'use client'

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { formatDate, formatDateTime } from '@/lib/utils/format'

/**
 * Map i18n language codes to BCP 47 locale strings.
 */
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  th: 'th-TH',
  zh: 'zh-CN',
}

/**
 * Hook that returns locale-aware + timezone-aware date formatters.
 *
 * Uses the current user's timezone from auth context
 * and the active i18n language for locale formatting.
 *
 * Usage:
 *   const { fmtDate, fmtDateTime } = useDateFormat()
 *   <td>{fmtDate(item.createdAt)}</td>
 *   <td>{fmtDateTime(item.confirmedAt)}</td>
 */
export function useDateFormat() {
  const { user } = useAuth()
  const { i18n } = useTranslation()

  const locale = LOCALE_MAP[i18n.language] || i18n.language || undefined
  const timeZone = user?.timezone || undefined // undefined = browser default

  const opts = useMemo(() => ({ locale, timeZone }), [locale, timeZone])

  const fmtDate = useCallback((value: string | number | Date | null | undefined) => formatDate(value, opts), [opts])

  const fmtDateTime = useCallback(
    (value: string | number | Date | null | undefined) => formatDateTime(value, opts),
    [opts]
  )

  return { fmtDate, fmtDateTime, locale, timeZone }
}
