'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadAdminLocale } from '@/lib/i18n'

/**
 * Drop-in replacement for useTranslation() in admin pages/components.
 * Lazy-loads admin locale keys on first render so t('admin.xxx') works.
 * Returns the same { t, i18n, ready } shape as useTranslation().
 */
export function useAdminTranslation() {
  const translation = useTranslation('common')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void loadAdminLocale().then(() => setLoaded(true))
  }, [translation.i18n.language])

  return { ...translation, adminReady: loaded }
}
