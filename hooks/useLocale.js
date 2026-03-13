'use client'

import { useTranslation } from 'react-i18next'

const LOCALE_MAP = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }

/**
 * Returns BCP 47 locale string derived from current i18n language.
 * Eliminates duplicated useMemo blocks across admin pages.
 */
export function useLocale() {
  const { i18n } = useTranslation()
  return LOCALE_MAP[i18n.language] || 'en-US'
}
