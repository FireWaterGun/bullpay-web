import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Only English common keys are statically bundled (fallback language).
// Admin keys and non-English locales are lazy-loaded on demand.
import en from '../locales/en/common.json'

const SUPPORTED_LANGS = ['en', 'th', 'zh'] as const

// Lazy loaders — webpack/turbopack creates separate chunks for each locale
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localeLoaders: Record<string, () => Promise<{ default: any }>> = {
  th: () => import('../locales/th/common.json'),
  zh: () => import('../locales/zh/common.json'),
}

// Admin locale loaders — loaded only when admin pages are visited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminLocaleLoaders: Record<string, () => Promise<{ default: any }>> = {
  en: () => import('../locales/en/admin.json'),
  th: () => import('../locales/th/admin.json'),
  zh: () => import('../locales/zh/admin.json'),
}

/** Load a non-English locale and register it with i18next */
async function loadLocale(lng: string) {
  if (lng === 'en' || !localeLoaders[lng]) return
  if (i18n.hasResourceBundle(lng, 'common')) return
  const mod = await localeLoaders[lng]()
  i18n.addResourceBundle(lng, 'common', mod.default, true, true)
}

/** Lazy-load admin translations for the given language (or current language).
 *  Merges admin keys under common.admin.* so existing t('admin.xxx') calls work unchanged. */
const adminLoadedLangs = new Set<string>()
export async function loadAdminLocale(lng?: string) {
  const lang = lng || i18n.language?.split('-')[0] || 'en'
  if (adminLoadedLangs.has(lang)) return
  if (!adminLocaleLoaders[lang]) return
  const mod = await adminLocaleLoaders[lang]()
  i18n.addResourceBundle(lang, 'common', { admin: mod.default }, true, true)
  adminLoadedLangs.add(lang)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
    },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGS],
    defaultNS: 'common',
    ns: ['common'],
    // React handles XSS protection via JSX escaping — this is the recommended react-i18next setting
    interpolation: { escapeValue: false },
    detection: {
      // order of detection
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },
  })
  .then(() => {
    // After init, lazy-load the detected language (if not English)
    const lng = i18n.language?.split('-')[0]
    if (lng && lng !== 'en') {
      void loadLocale(lng).then(() => void i18n.changeLanguage(lng))
    }
  })

// When user switches language, lazy-load the new locale before applying it
i18n.on('languageChanged', (lng: string) => {
  const base = lng.split('-')[0]
  if (base !== 'en' && !i18n.hasResourceBundle(base, 'common')) {
    void loadLocale(base).then(() => void i18n.changeLanguage(base))
  }
  // Reload admin locale for new language if admin was already loaded
  if (adminLoadedLangs.size > 0 && !adminLoadedLangs.has(base)) {
    void loadAdminLocale(base)
  }
})

// Expose i18next globally so Sneat theme main.js can access it
// (main.js calls i18next.changeLanguage / i18next.language directly)
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).i18next = i18n
}

export default i18n
