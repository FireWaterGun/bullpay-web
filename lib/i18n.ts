import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Only English is statically bundled (fallback language).
// Thai and Chinese are lazy-loaded on demand to reduce initial bundle (~140 KB saved).
import en from '../locales/en/common.json'

const SUPPORTED_LANGS = ['en', 'th', 'zh'] as const

// Lazy loaders — webpack/turbopack creates separate chunks for each locale
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localeLoaders: Record<string, () => Promise<{ default: any }>> = {
  th: () => import('../locales/th/common.json'),
  zh: () => import('../locales/zh/common.json'),
}

/** Load a non-English locale and register it with i18next */
async function loadLocale(lng: string) {
  if (lng === 'en' || !localeLoaders[lng]) return
  if (i18n.hasResourceBundle(lng, 'common')) return
  const mod = await localeLoaders[lng]()
  i18n.addResourceBundle(lng, 'common', mod.default, true, true)
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
})

// Expose i18next globally so Sneat theme main.js can access it
// (main.js calls i18next.changeLanguage / i18next.language directly)
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).i18next = i18n
}

export default i18n
